import os
from typing import List, Dict, Any, Optional
from pathlib import Path
from .model_runner import ModelRunner

class CodeAnalyzer:
    def __init__(self):
        self.model_runner = ModelRunner()
        self.file_issues_cache = {}
        self.project_structure = {}

    def analyze_project(self, project_root: str) -> List[Dict[str, Any]]:
        """Analyze all code files in a project directory."""
        if not os.path.isdir(project_root):
            return [self._create_issue(
                file_path=project_root,
                line=0,
                issue_type="invalid_path",
                message=f"Project directory not found: {project_root}",
                severity="error"
            )]

        self._scan_project_structure(project_root)
        all_issues = []
        
        # First pass: Analyze individual files
        for file_path in self._get_code_files(project_root):
            file_issues = self.analyze_file(file_path)
            all_issues.extend(file_issues)
            
        # Second pass: Cross-file analysis
        cross_file_issues = self._analyze_cross_file_issues()
        all_issues.extend(cross_file_issues)
        
        return all_issues

    def analyze_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Analyze a single code file."""
        if not os.path.exists(file_path):
            return [self._create_issue(
                file_path=file_path,
                line=0,
                issue_type="file_not_found",
                message="File not found",
                severity="error"
            )]

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                code = f.read()
                
            # Get file-specific issues
            file_issues = self.model_runner.analyze_code(code, file_path)
            
            # Cache issues for cross-file analysis
            self.file_issues_cache[file_path] = file_issues
            
            # Add file path to each issue
            for issue in file_issues:
                issue['file'] = file_path
                
            return file_issues
            
        except Exception as e:
            return [self._create_issue(
                file_path=file_path,
                line=0,
                issue_type="analysis_error",
                message=f"Failed to analyze file: {str(e)}",
                severity="error"
            )]

    def _scan_project_structure(self, root_dir: str) -> None:
        """Scan and cache project structure for cross-file analysis."""
        self.project_structure = {}
        for root, _, files in os.walk(root_dir):
            rel_path = os.path.relpath(root, root_dir)
            self.project_structure[rel_path] = [
                f for f in files 
                if f.endswith(('.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css'))
            ]

    def _get_code_files(self, root_dir: str) -> List[str]:
        """Get all code files in the project."""
        code_files = []
        for root, _, files in os.walk(root_dir):
            for file in files:
                if file.endswith(('.py', '.js', '.jsx', '.ts', '.tsx')):
                    code_files.append(os.path.join(root, file))
        return code_files

    def _analyze_cross_file_issues(self) -> List[Dict[str, Any]]:
        """Analyze issues that span multiple files."""
        issues = []
        # TODO: Implement cross-file analysis logic
        # - Check for circular imports
        # - Find unused exports
        # - Detect inconsistent function signatures
        # - Find duplicate code across files
        return issues

    def _create_issue(
        self, 
        file_path: str,
        line: int,
        issue_type: str,
        message: str,
        severity: str = "error"
    ) -> Dict[str, Any]:
        """Helper to create a standardized issue dictionary."""
        return {
            "file": file_path,
            "line": line,
            "type": issue_type,
            "message": message,
            "severity": severity,
            "source": "analyzer"
        }

# Backward compatibility
def analyze_code(file_path: str) -> List[Dict[str, Any]]:
    """Legacy function for backward compatibility."""
    analyzer = CodeAnalyzer()
    return analyzer.analyze_file(file_path)
