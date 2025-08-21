import subprocess
import json
import os
import logging
import platform
from pathlib import Path
import tempfile
import shutil

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
    
    def run_all_linters(self, files):
        """Run all appropriate linters on the given files"""
        if not files:
            logger.warning("No files provided for linting")
            return []
            
        logger.info(f"Running linters on {len(files)} files")
        python_files = [f for f in files if f.endswith(('.py',))]
        js_files = [f for f in files if f.endswith(('.js', '.jsx', '.ts', '.tsx'))]

        all_issues = []
        
        # Log file type distribution
        logger.info(f"Found {len(python_files)} Python files and {len(js_files)} JavaScript/TypeScript files")

        try:
            # Run Python linters
            if python_files:
                logger.debug("Running Python linters...")
                flake8_issues = self.run_flake8(python_files)
                bandit_issues = self.run_bandit(python_files)
                pylint_issues = self.run_pylint(python_files)
                all_issues.extend(flake8_issues)
                all_issues.extend(bandit_issues)
                all_issues.extend(pylint_issues)
                logger.info(f"Python linters found {len(flake8_issues) + len(bandit_issues) + len(pylint_issues)} issues")

            # Run JavaScript linters
            if js_files:
                logger.debug("Running ESLint...")
                eslint_issues = self.run_eslint(js_files)
                all_issues.extend(eslint_issues)
                logger.info(f"ESLint found {len(eslint_issues)} issues")
                
            # Log summary
            issue_types = {}
            for issue in all_issues:
                tool = issue.get('tool', 'unknown')
                severity = issue.get('severity', 'unknown')
                issue_types[f"{tool}.{severity}"] = issue_types.get(f"{tool}.{severity}", 0) + 1
                
            logger.info(f"Total issues found: {len(all_issues)}")
            for issue_type, count in issue_types.items():
                logger.info(f"  - {issue_type}: {count}")
                
        except Exception as e:
            logger.error(f"Error during linting: {str(e)}", exc_info=True)
        
        return all_issues

    def run_eslint(self, js_files):
        """Run ESLint on JavaScript/TypeScript files - Windows-compatible implementation."""
        if not js_files:
            logger.debug("No JavaScript files to analyze with ESLint")
            return []

        if not shutil.which('npm'):
            logger.error("'npm' command not found. Skipping ESLint. Please install Node.js.")
            return []

        logger.info(f"Starting ESLint analysis on {len(js_files)} JavaScript files")
        logger.debug(f"Files to analyze: {', '.join(js_files[:5])}{'...' if len(js_files) > 5 else ''}")
        
        # Create a dedicated eslint workspace in linters folder
        eslint_workspace = self.linter_config_path / 'eslint_workspace'
        eslint_workspace.mkdir(exist_ok=True)
        
        # Create package.json directly in workspace with React support
        package_json_content = {
            "name": "eslint-workspace",
            "version": "1.0.0",
            "private": True,
            "devDependencies": {
                "eslint": "^8.57.0",
                "eslint-config-react-app": "^7.0.1",
                "@typescript-eslint/eslint-plugin": "^6.0.0",
                "@typescript-eslint/parser": "^6.0.0",
                "eslint-plugin-react": "^7.33.0",
                "eslint-plugin-react-hooks": "^4.6.0",
                "eslint-plugin-jsx-a11y": "^6.7.0",
                "eslint-plugin-import": "^2.28.0"
            }
        }
        
        package_json_path = eslint_workspace / 'package.json'
        
        # Check if package.json needs updating
        needs_update = True
        if package_json_path.exists():
            try:
                with open(package_json_path, 'r') as f:
                    existing_content = json.load(f)
                if existing_content.get('devDependencies', {}).get('eslint-config-react-app'):
                    needs_update = False
            except:
                needs_update = True
        
        if needs_update:
            # Remove existing node_modules to force clean install
            node_modules_path = eslint_workspace / 'node_modules'
            if node_modules_path.exists():
                logger.info("Removing existing node_modules for clean React install...")
                shutil.rmtree(node_modules_path)
            
            with open(package_json_path, 'w') as f:
                json.dump(package_json_content, f, indent=2)
            logger.info("Updated package.json with React dependencies")
        
        issues = []
        try:
            # Install ESLint and React plugins if not already installed or if package.json changed
            node_modules_path = eslint_workspace / 'node_modules'
            react_app_config = node_modules_path / 'eslint-config-react-app'
            
            if not node_modules_path.exists() or not react_app_config.exists():
                logger.info("Installing ESLint with React support in workspace...")
                result = subprocess.run(
                    ['npm', 'install'], 
                    cwd=str(eslint_workspace), 
                    capture_output=True, 
                    text=True,
                    shell=True
                )
                if result.returncode != 0:
                    logger.error(f"npm install failed: {result.stderr}")
                    return []
                logger.info("ESLint with React support installed successfully")

            # Use Node.js directly to run ESLint (most reliable on Windows)
            eslint_script = eslint_workspace / 'node_modules' / 'eslint' / 'bin' / 'eslint.js'
            config_file = self.linter_config_path / '.eslintrc.json'
            
            if not eslint_script.exists():
                logger.error(f"ESLint script not found at {eslint_script}")
                return []
            
            # Build command using node directly - use relative paths from repo root
            # Use --no-eslintrc to ignore user's config and force our config
            cmd = [
                'node',
                str(eslint_script),
                '--no-eslintrc',
                '--config', str(config_file),
                '--format', 'json'
            ] + js_files  # Use relative paths as passed in
            
            logger.info(f"Running ESLint command: {' '.join(cmd[:5])}... (truncated)")
            
            # Run ESLint
            result = subprocess.run(
                cmd,
                cwd=str(self.repo_path),
                capture_output=True,
                text=True,
                shell=True
            )
            
            logger.info(f"ESLint completed with return code: {result.returncode}")
            
            # Parse results (ESLint returns non-zero for linting issues, which is normal)
            if result.stdout:
                try:
                    data = json.loads(result.stdout)
                    for file_result in data:
                        file_path = Path(file_result['filePath'])
                        try:
                            relative_path = file_path.relative_to(self.repo_path)
                        except ValueError:
                            # If relative_to fails, use the filename
                            relative_path = file_path.name
                        
                        for issue in file_result.get('messages', []):
                            severity_map = {1: 'warning', 2: 'error'}
                            issues.append({
                                'tool': 'eslint',
                                'severity': severity_map.get(issue['severity'], 'info'),
                                'file': str(relative_path),
                                'line': issue.get('line', 1),
                                'column': issue.get('column', 1),
                                'code': issue.get('ruleId', 'unknown'),
                                'message': issue['message'],
                                'suggestion': f"ESLint: {issue['message']}"
                            })
                    
                    logger.info(f"ESLint found {len(issues)} issues")
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse ESLint JSON output: {e}")
                    logger.debug(f"ESLint stdout: {result.stdout[:500]}")
            else:
                logger.info("ESLint completed with no output")
            
            if result.stderr:
                logger.warning(f"ESLint stderr: {result.stderr}")

        except Exception as e:
            logger.error(f"ESLint execution failed: {e}")
            import traceback
            logger.debug(traceback.format_exc())
        
        return issues
