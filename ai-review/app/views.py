import logging
import os
import json
import datetime
import platform
import psutil
import tempfile
import shutil

from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View

from .analyzer import analyze_code
from .utils import collect_code_files, collect_code_files_from_path
from .model_runner import ModelRunner
from .model_config import model_manager, ModelType
from .context_analyzer import context_analyzer
from .linter_service import LinterService
from .result_processor import ResultProcessor

# Get the base directory of the project
BASE_DIR = getattr(settings, 'BASE_DIR', os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Configure logging
logger = logging.getLogger(__name__)

# AI runner will be initialized per request with user context

def root(request):
    return render(request, 'root.html')

def review_repo(request):
    """
    Handle repository code review requests.
    This is a wrapper around the CodeReviewView for URL routing.
    """
    if request.method == 'POST':
        view = CodeReviewView.as_view()
        return view(request)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def custom_404(request, exception):
    return render(request, '404.html', status=404)

def custom_500(request):
    return render(request, '500.html', status=500)

def custom_405(request, exception):
    return render(request, '405.html', status=405)

class HealthView(View):
    def get(self, request):
        return JsonResponse({
            'status': 'healthy',
            'service': 'ai-review',
            'gpu_available': model_manager.check_gpu_availability(),
            'models_available': len(model_manager.model_configs),
            'loaded_models': len(model_manager._loaded_models)
        })

class ShutdownView(View):
    def post(self, request):
        return JsonResponse({'status': 'shutting down'}), 500

@api_view(['GET'])
def health_check(request):
    """Health check endpoint for the AI Review service."""
    start_time = datetime.datetime.utcnow()
    try:
        # Basic service status
        status_info = {
            'status': 'ok',
            'service': 'ai-review',
            'timestamp': start_time.isoformat(),
            'responseTime': 0,  # Will be updated after processing
            'system': {
                'platform': platform.system(),
                'node': platform.node(),
                'python_version': platform.python_version(),
            },
            'process': {
                'pid': os.getpid(),
                'cpu_percent': psutil.Process().cpu_percent(interval=0.1),
                'memory_info': dict(psutil.Process().memory_info()._asdict()),
            },
            'dependencies': {
                'django': '3.2.0',  # Update with your Django version
                'djangorestframework': '3.12.4',  # Update with your DRF version
            }
        }
        
        # Calculate response time in milliseconds
        response_time = (datetime.datetime.utcnow() - start_time).total_seconds() * 1000
        status_info['responseTime'] = round(response_time, 2)
        
        return Response(status_info, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'status': 'error', 'error': str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )



@method_decorator(csrf_exempt, name='dispatch')
class CodeReviewView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            project_id = data.get('projectId')
            repo_path = data.get('repoPath')
            model_type = data.get('model_type', 'deepseek_lite')  # Default model
            
            if not project_id:
                return JsonResponse({
                    'error': 'Project ID is required'
                }, status=400)
            
            # Determine the repository path
            try:
                # Look for repo in deployment-worker/repos with project ID prefix
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                repos_dir = os.path.join(base_dir, "deployment-worker", "repos")
                
                if not os.path.exists(repos_dir):
                    raise FileNotFoundError(f"Repository directory not found: {repos_dir}")
                
                # Find all directories that start with the project ID
                matching_dirs = [
                    os.path.join(repos_dir, d) for d in os.listdir(repos_dir)
                    if os.path.isdir(os.path.join(repos_dir, d)) and d.startswith(project_id)
                ]
                
                if not matching_dirs:
                    raise FileNotFoundError(
                        f"No repository found for project ID: {project_id} in {repos_dir}"
                    )
                
                # Use the first matching directory (should only be one per project ID)
                target_path = matching_dirs[0]
                logger.info(f"Found repository at: {target_path}")
                
                # Collect code files for analysis
                file_data = collect_code_files_from_path(target_path)
                
            except Exception as e:
                logger.error(f"Error finding repository: {str(e)}")
                return JsonResponse({
                    'error': f'Repository not found: {str(e)}',
                    'details': f'Searched in: {repos_dir if "repos_dir" in locals() else "[path not determined]"}'
                }, status=404)
            
            if not file_data:
                return JsonResponse({
                    'verdict': 'allow',
                    'reason': 'No code files found to analyze',
                    'issue_count': 0,
                    'issues': []
                })
            
            # Extract file paths from the file data
            files = [f['file_path'] for f in file_data if 'file_path' in f]
            
            logger.info(f"Analyzing {len(files)} files for project {project_id}")
            
            # Initialize services
            linter_service = LinterService(target_path)
            result_processor = ResultProcessor()
            
            # Run linters on all files
            logger.info("Running static analysis linters...")
            linter_issues = linter_service.run_all_linters([os.path.relpath(f, target_path) for f in files])
            
            # Validate model type
            try:
                model_enum = ModelType(model_type)
                logger.info(f"Using AI model: {model_type}")
            except ValueError:
                available_models = [m.value for m in ModelType]
                return JsonResponse({
                    'error': f'Invalid model type: {model_type}',
                    'available_models': available_models
                }, status=400)
            
            # Initialize the AI model runner once with the selected model
            logger.info(f"Initializing AI model runner with {model_type}...")
            ai_runner = ModelRunner(model_type=model_enum)

            # Run AI analysis
            logger.info(f"Running AI code analysis with model: {model_type}...")
            deepseek_issues = []
            
            # Analyze up to 5 most important files with AI
            important_files = files[:5]
            
            for file_path in important_files:
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        file_content = f.read()
                    
                    # Get relative path for display
                    rel_path = os.path.relpath(file_path, target_path)
                    logger.info(f"AI analyzing file: {rel_path}")
                    
                    # Use the single AI runner instance for analysis
                    ai_issues = ai_runner.analyze(file_content, file_path)
                    
                    # Add file context to AI issues
                    if isinstance(ai_issues, list):
                        for issue in ai_issues:
                            issue['file'] = rel_path
                            deepseek_issues.append(issue)
                    
                except Exception as e:
                    logger.error(f"Error analyzing file {file_path} with AI: {e}")
                    continue
            
            # Merge and process all results
            logger.info("Processing and merging analysis results...")
            processor = ResultProcessor()
            merged_issues = processor.merge_results(linter_issues, deepseek_issues)
            verdict_result = processor.generate_verdict(merged_issues, 'ai-review')
            
            logger.info(f"Analysis complete for project {project_id}: {verdict_result['verdict']} ({verdict_result['issue_count']} issues)")
            
            return JsonResponse({
                'verdict': verdict_result['verdict'],
                'reason': verdict_result['reason'],
                'issue_count': verdict_result['issue_count'],
                'severity_breakdown': verdict_result['severity_breakdown'],
                'issues': verdict_result['issues'][:50],  # Limit to first 50 issues
                'reason': verdict_data['reason'],
                'issue_count': verdict_data['issue_count'],
                'severity_breakdown': verdict_data['severity_breakdown'],
                'issues': verdict_data['issues'][:50],  # Limit to first 50 issues
                'linter_count': len(linter_issues),
                'ai_count': len(deepseek_issues),
                'model_used': model_type,
                'model_loaded': model_enum in model_manager._loaded_models
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON in request body'
            }, status=400)
        except Exception as e:
            logger.error(f"Code review failed: {e}")
            return JsonResponse({
                'error': f'Code review failed: {str(e)}'
            }, status=500)
        finally:
            logger.info("Clearing AI model cache after request.")
            model_manager.unload_all_models()



def process_analysis_results(issues):
    """Process analysis results into structured format."""
    if not issues:
        return {
            'verdict': 'approve',
            'reason': 'No critical issues found',
            'issue_count': 0,
            'severity_breakdown': {
                'security': 0,
                'error': 0,
                'warning': 0
            },
            'issues': [],
            'linter_count': 0,
            'ai_count': 0
        }
    
    # Count issues by severity and tool
    severity_breakdown = {'security': 0, 'error': 0, 'warning': 0}
    tool_breakdown = {'linter': 0, 'ai': 0}
    
    for issue in issues:
        severity = issue.get('severity', 'warning')
        tool = issue.get('tool', 'unknown')
        
        if severity in severity_breakdown:
            severity_breakdown[severity] += 1
        
        if 'shard-ai' in tool.lower():
            tool_breakdown['ai'] += 1
        else:
            tool_breakdown['linter'] += 1
    
    # Determine verdict
    error_count = severity_breakdown['error']
    security_count = severity_breakdown['security']
    
    if error_count > 0:
        verdict = 'deny'
        reason = f'Critical issues found: {security_count} security, {error_count} errors'
    elif security_count > 3:
        verdict = 'manual_review'
        reason = f'Multiple security issues found: {security_count} security issues require review'
    else:
        verdict = 'approve'
        reason = 'No critical blocking issues found'
    
    return {
        'verdict': verdict,
        'reason': reason,
        'issue_count': len(issues),
        'severity_breakdown': severity_breakdown,
        'issues': issues,
        'linter_count': tool_breakdown['linter'],
        'ai_count': tool_breakdown['ai']
    }