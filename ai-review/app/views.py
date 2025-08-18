from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from .analyzer import analyze_code
from .utils import collect_code_files, collect_code_files_from_path
from .deepseek_runner import DeepSeekRunner
from .linter_service import LinterService
from .result_processor import ResultProcessor
import platform
import psutil
import os
import datetime
import json
import tempfile
import shutil

# Configure logging
logger = logging.getLogger(__name__)

# Initialize AI runner
ai_runner = DeepSeekRunner()

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
            'model_loaded': ai_runner.model is not None
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

@api_view(['POST'])
def shutdown(request):
    """
    Shutdown the server gracefully.
    This endpoint is used for graceful shutdown from the backend service.
    """
    # Only allow shutdown in development or if explicitly enabled in production
    if not settings.DEBUG and not getattr(settings, 'ALLOW_SHUTDOWN_ENDPOINT', False):
        return Response(
            {'status': 'error', 'message': 'Shutdown endpoint is disabled in production'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Log the shutdown request
    logger = logging.getLogger(__name__)
    logger.warning('Received shutdown request')
    
    # Schedule the server shutdown after a short delay
    def delayed_shutdown():
        import time
        time.sleep(1)  # Give time for the response to be sent
        os._exit(0)
    
    import threading
    threading.Thread(target=delayed_shutdown).start()
    
    return Response({'status': 'shutting_down'}, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class CodeReviewView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            project_id = data.get('projectId')
            repo_path = data.get('repoPath')
            
            if not project_id:
                return JsonResponse({
                    'error': 'Project ID is required'
                }, status=400)
            
            # If repo_path is provided, use it directly
            if repo_path and os.path.exists(repo_path):
                target_path = repo_path
                logger.info(f"Using provided repo path: {repo_path}")
            else:
                # Default to cloned repo path
                target_path = f"/tmp/repos/{project_id}"
                logger.info(f"Using default repo path: {target_path}")
            
            if not os.path.exists(target_path):
                return JsonResponse({
                    'error': f'Repository path does not exist: {target_path}'
                }, status=404)
            
            # Collect code files for analysis
            if repo_path and os.path.exists(repo_path):
                # Use provided repo path directly
                file_data = collect_code_files_from_path(repo_path)
            else:
                # Use project ID to find repo in standard location
                file_data = collect_code_files(project_id)
            
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
            
            # Run DeepSeek AI analysis on selected files (limit to avoid token limits)
            logger.info("Running AI code analysis...")
            deepseek_issues = []
            
            # Analyze up to 10 most important files with AI
            important_files = files[:10]
            
            for file_path in important_files:
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        file_content = f.read()
                    
                    # Get relative path for display
                    rel_path = os.path.relpath(file_path, target_path)
                    
                    # Run AI analysis
                    ai_issues = ai_runner.analyze_code(file_content, rel_path)
                    
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
            final_result = result_processor.merge_results(linter_issues, deepseek_issues)
            
            # Generate verdict
            verdict_data = result_processor.generate_verdict(final_result)
            
            logger.info(f"Analysis complete for project {project_id}: {verdict_data['verdict']} ({verdict_data['issue_count']} issues)")
            
            return JsonResponse({
                'verdict': verdict_data['verdict'],
                'reason': verdict_data['reason'],
                'issue_count': verdict_data['issue_count'],
                'severity_breakdown': verdict_data['severity_breakdown'],
                'issues': verdict_data['issues'][:50],  # Limit to first 50 issues
                'linter_count': len(linter_issues),
                'ai_count': len(deepseek_issues)
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