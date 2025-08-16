import subprocess
import json
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class LinterService:
    def __init__(self, repo_path):
        self.repo_path = Path(repo_path)
        self.linter_config_path = Path(__file__).parent.parent / 'linters'
        
    def run_flake8(self, python_files):
        """Run flake8 on Python files"""
        if not python_files:
            return []
            
        issues = []
        config_file = self.linter_config_path / '.flake8'
        
        try:
            cmd = ['flake8', '--config', str(config_file), '--format=json'] + python_files
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.repo_path)
            
            if result.stdout:
                for line in result.stdout.strip().split('\n'):
                    if line:
                        try:
                            data = json.loads(line)
                            issues.append({
                                'tool': 'flake8',
                                'severity': 'error' if data['code'].startswith('E') else 'warning',
                                'file': data['filename'],
                                'line': data['line_number'],
                                'column': data['column_number'],
                                'code': data['code'],
                                'message': data['text'],
                                'suggestion': f"Fix {data['code']}: {data['text']}"
                            })
                        except json.JSONDecodeError:
                            continue
                            
        except Exception as e:
            logger.error(f"Flake8 execution failed: {e}")
            
        return issues
    
    def run_bandit(self, python_files):
        """Run bandit security linter on Python files"""
        if not python_files:
            return []
            
        issues = []
        config_file = self.linter_config_path / '.bandit'
        
        try:
            cmd = ['bandit', '-c', str(config_file), '-f', 'json'] + python_files
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.repo_path)
            
            if result.stdout:
                data = json.loads(result.stdout)
                for issue in data.get('results', []):
                    issues.append({
                        'tool': 'bandit',
                        'severity': 'security',
                        'file': issue['filename'],
                        'line': issue['line_number'],
                        'column': issue.get('col_offset', 0),
                        'code': issue['test_id'],
                        'message': issue['issue_text'],
                        'suggestion': f"Security issue: {issue['issue_text']}"
                    })
                    
        except Exception as e:
            logger.error(f"Bandit execution failed: {e}")
            
        return issues
    
    def run_pylint(self, python_files):
        """Run pylint on Python files"""
        if not python_files:
            return []
            
        issues = []
        config_file = self.linter_config_path / '.pylintrc'
        
        try:
            cmd = ['pylint', '--rcfile', str(config_file), '--output-format=json'] + python_files
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.repo_path)
            
            if result.stdout:
                data = json.loads(result.stdout)
                for issue in data:
                    severity_map = {
                        'error': 'error',
                        'warning': 'warning', 
                        'refactor': 'info',
                        'convention': 'style',
                        'info': 'info'
                    }
                    
                    issues.append({
                        'tool': 'pylint',
                        'severity': severity_map.get(issue['type'], 'info'),
                        'file': issue['path'],
                        'line': issue['line'],
                        'column': issue['column'],
                        'code': issue['symbol'],
                        'message': issue['message'],
                        'suggestion': f"Pylint {issue['type']}: {issue['message']}"
                    })
                    
        except Exception as e:
            logger.error(f"Pylint execution failed: {e}")
            
        return issues
    
    def run_eslint(self, js_files):
        """Run ESLint on JavaScript/TypeScript files"""
        if not js_files:
            return []
            
        issues = []
        config_file = self.linter_config_path / '.eslintrc.json'
        
        try:
            cmd = ['eslint', '-c', str(config_file), '--format=json'] + js_files
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.repo_path)
            
            if result.stdout:
                data = json.loads(result.stdout)
                for file_result in data:
                    for issue in file_result.get('messages', []):
                        severity_map = {1: 'warning', 2: 'error'}
                        
                        issues.append({
                            'tool': 'eslint',
                            'severity': severity_map.get(issue['severity'], 'info'),
                            'file': file_result['filePath'],
                            'line': issue['line'],
                            'column': issue['column'],
                            'code': issue.get('ruleId', 'unknown'),
                            'message': issue['message'],
                            'suggestion': f"ESLint: {issue['message']}"
                        })
                        
        except Exception as e:
            logger.error(f"ESLint execution failed: {e}")
            
        return issues
    
    def run_all_linters(self, files):
        """Run all appropriate linters on the given files"""
        python_files = [f for f in files if f.endswith(('.py',))]
        js_files = [f for f in files if f.endswith(('.js', '.jsx', '.ts', '.tsx'))]
        
        all_issues = []
        
        # Run Python linters
        all_issues.extend(self.run_flake8(python_files))
        all_issues.extend(self.run_bandit(python_files))
        all_issues.extend(self.run_pylint(python_files))
        
        # Run JavaScript linters
        all_issues.extend(self.run_eslint(js_files))
        
        return all_issues
