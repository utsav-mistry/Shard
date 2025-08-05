import os
from .deepseek_runner import get_code_issues

def analyze_code(file_path):
    """
    Given a file path, read code, run DeepSeek analysis, return issues list.
    Each issue includes: file, line, type, advice, source.
    """
    if not os.path.exists(file_path):
        return [{
            "file": file_path,
            "line": 0,
            "type": "file_not_found",
            "advice": "This file does not exist.",
            "source": "system"
        }]

    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            code = f.read()
    except Exception as e:
        return [{
            "file": file_path,
            "line": 0,
            "type": "read_error",
            "advice": f"Failed to read file: {str(e)}",
            "source": "system"
        }]

    try:
        deepseek_issues = get_code_issues(code)
    except Exception as e:
        return [{
            "file": file_path,
            "line": 0,
            "type": "model_error",
            "advice": f"AI model failed to analyze: {str(e)}",
            "source": "ai"
        }]

    return [{
        "file": file_path,
        "line": issue.get("line", 0),
        "type": issue.get("type", "unknown"),
        "advice": issue.get("advice", "No suggestion provided."),
        "source": "ai"
    } for issue in deepseek_issues]
