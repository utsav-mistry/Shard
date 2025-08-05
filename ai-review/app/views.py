from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import collect_code_files
from .analyzer import analyze_code

def root(request):
    return render(request, 'root.html')

def custom_404(request, exception):
    return render(request, '404.html', status=404)

def custom_500(request):
    return render(request, '500.html', status=500)

def custom_405(request, exception):
    return render(request, '405.html', status=405)


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