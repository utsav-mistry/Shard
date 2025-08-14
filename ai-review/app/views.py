from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging
from .utils import collect_code_files
from .analyzer import analyze_code
import platform
import psutil
import os
import datetime

def root(request):
    return render(request, 'root.html')

def custom_404(request, exception):
    return render(request, '404.html', status=404)

def custom_500(request):
    return render(request, '500.html', status=500)

def custom_405(request, exception):
    return render(request, '405.html', status=405)

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


@api_view(['POST'])
def review_repo(request):
    data = request.data
    project_id = data.get("projectId")

    if not project_id:
        return Response({"error": "Missing projectId"}, status=400)

    files = collect_code_files(project_id)
    all_issues = []

    for f in files:
        issues = analyze_code(f['file_path'])
        all_issues.extend(issues)

    # Categorize
    ai_issues = [i for i in all_issues if i.get("source") == "ai"]
    pattern_issues = [i for i in all_issues if i.get("source") == "pattern"]

    # Verdict Logic
    verdict = "allow"
    if len(all_issues) > 5:
        verdict = "deny"
    elif 1 <= len(all_issues) <= 5:
        verdict = "manual_review"

    return Response({
        "projectId": project_id,
        "verdict": verdict,
        "issueCount": len(all_issues),
        "aiIssueCount": len(ai_issues),
        "patternIssueCount": len(pattern_issues),
        "issues": all_issues
    })