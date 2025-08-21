import json
import os
import re
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from .model_config import model_manager, ModelType, ModelConfig
from .context_analyzer import context_analyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('ai_analysis.log')
    ]
)
logger = logging.getLogger(__name__)

class ModelRunner:
    """Enhanced AI code analysis with lazy model loading and GPU-only execution."""
    
    def __init__(self, model_type: Optional[ModelType] = None):
        self.model = None
        self.model_config = None
        self.model_type = model_type or ModelType.DEEPSEEK_LITE
    
    
    def analyze(self, code: str, file_path: str) -> List[Dict[str, Any]]:
        """Public method to run the full analysis pipeline."""
        # 1. Run linting and pattern analysis first for quick feedback
        logger.info("Running linting analysis...")
        linting_issues = self._run_linting_analysis(code, file_path)
        logger.info(f"Linting completed with {len(linting_issues)} issues found")
        
        # 2. Run AI analysis for deeper insights
        logger.info("Running AI analysis...")
        if not self._ensure_model_loaded():
            logger.warning("AI model not available, skipping AI analysis")
            ai_issues = []
        else:
            ai_issues = self._run_ai_analysis(code, file_path)
        logger.info(f"AI analysis completed with {len(ai_issues)} additional issues found")
        
        # 3. Combine and process results
        all_issues = linting_issues + ai_issues
        unique_issues = self._deduplicate_issues(all_issues)
        
        logger.info(f"Analysis complete. Total unique issues found: {len(unique_issues)}")
        return unique_issues

    def _run_linting_analysis(self, code: str, file_path: str) -> List[Dict[str, Any]]:
        """Run basic linting and pattern matching for common issues."""
        issues = []
        # Simple pattern matching for common anti-patterns
        patterns = {
            "Use of eval": r"\beval\s*\(",
            "Use of pickle": r"import\s+pickle|from\s+pickle\s+import",
            "Hardcoded secret (heuristic)": r"(secret|password|key)"
        }
        
        for message, pattern in patterns.items():
            for i, line in enumerate(code.splitlines()):
                if re.search(pattern, line, re.IGNORECASE):
                    issues.append({
                        'line': i + 1,
                        'severity': 'security',
                        'message': message,
                        'suggestion': 'Review usage of potentially insecure function or hardcoded secret.'
                    })
        logger.info(f"Pattern analysis found {len(issues)} issues")
        return issues

    def _ensure_model_loaded(self) -> bool:
        """Ensure the AI model is loaded, loading it if necessary."""
        if self.model and self.model_config:
            return True
        
        logger.info(f"Loading model on demand: {self.model_type.value}")
        
        # Get model from manager (will load if not cached)
        self.model = model_manager.get_loaded_model(self.model_type.value)
        self.model_config = model_manager.get_model_config(self.model_type.value)
        
        if not self.model or not self.model_config:
            logger.error(f"Failed to load model: {self.model_type.value}")
            return False
        
        return True
    
    def _run_ai_analysis(
        self, 
        code: str, 
        file_path: Optional[str] = None,
        related_files: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Analyze code using the AI model, focusing on critical issues only.
        
        Args:
            code: The source code to analyze
            file_path: Optional path of the file being analyzed
            related_files: Optional dict of {file_path: content} for related files
            
        Returns:
            List of critical issue dictionaries
        """
        # Load model on demand
        if not self._ensure_model_loaded():
            logger.warning("AI model not available, skipping AI analysis")
            return []

        try:
            prompt = self._build_ai_prompt(code, file_path, related_files)

            # Generate response with model-specific settings
            response = self.model(
                prompt,
                max_tokens=self.model_config.max_tokens if self.model_config else 2000,
                temperature=self.model_config.temperature if self.model_config else 0.2,
                stop=["</s>", "[/INST]", "```"],
                repeat_penalty=1.1,
                top_k=40,
                top_p=0.95
            )

            # Log token usage
            tokens_used = len(response['choices'][0]['text'].split())
            logger.info(f"AI analysis used {tokens_used} tokens")

            response_text = response['choices'][0]['text'].strip()
            self._save_response(response_text, 'ai_response.txt')

            # Clean and parse the response
            issues = self._clean_and_parse_json(response_text)

            # Add tool source and validate issues
            validated_issues = []
            for issue in issues:
                validated = self._validate_issue(issue, file_path)
                if validated:
                    # Only include security and critical errors
                    if validated.get('severity') in ['security', 'error']:
                        validated['tool'] = 'shard-ai'
                        validated_issues.append(validated)
            
            return validated_issues
                
        except Exception as e:
            logger.error(f"Error during AI model execution: {str(e)}", exc_info=True)
            return [{
                'line': 1,
                'message': 'AI analysis failed. Check the logs for details.',
                'severity': 'error',
                'tool': 'shard-ai',
                'suggestion': 'The AI model encountered an error. Please check the logs for more information.'
            }]
    
    def _build_ai_prompt(self, code: str, file_path: Optional[str] = None, related_files: Optional[Dict[str, str]] = None) -> str:
        is_js = file_path and file_path.endswith(('.js', '.jsx', '.ts', '.tsx'))
        file_ext = os.path.splitext(file_path or '')[-1].lower()
        
        # Get enhanced project context
        enhanced_context = ''
        if file_path and os.path.exists(file_path):
            try:
                project_path = self._find_project_root(file_path)
                if project_path:
                    enhanced_context = context_analyzer.get_enhanced_context_for_ai(
                        project_path, file_path, max_context_length=2000
                    )
                    if enhanced_context:
                        enhanced_context = f'\n\nProject Context:\n{enhanced_context}\n'
            except Exception as e:
                logger.warning(f"Failed to get enhanced context: {e}")
        
        # Add basic related files context as fallback
        related_files_context = ''
        if related_files and not enhanced_context:
            related_files_context = '\n\nRelated files (for reference only):\n'
            for rel_path, content in list(related_files.items())[:3]:  # Limit to 3 files
                related_files_context += f'\n--- {rel_path} ---\n{content[:400]}...\n'
        if is_js:
            prompt = f"""[INST] <<SYS>>
You are an advanced JavaScript/TypeScript code analyzer. Your task is to thoroughly analyze code and return a JSON array of issues with detailed information.

CRITICAL RULES:
1. Output MUST be a valid JSON array only - no other text or explanations.
2. For each issue, provide:
   - `severity`: "error" (prevents execution), "warning" (potential issue), or "security" (vulnerability)
   - `line`: Line number where issue occurs (1-based)
   - `message`: Concise description of the issue
   - `suggestion`: Specific code fix or recommendation
   - `category`: One of ["syntax", "type", "security", "performance", "best-practice"]
3. Always validate JSON syntax before returning.

ANALYSIS PRIORITY:
1. CRITICAL: Syntax errors, missing imports, undefined variables
2. SECURITY: XSS, injection, auth issues, sensitive data exposure
3. ERRORS: Runtime errors, type mismatches, invalid operations
4. WARNINGS: Code smells, anti-patterns, deprecated APIs

IGNORE:
- Code style issues (formatting, naming conventions)
- Comments and documentation
- Test files (*.test.js, *.spec.js)
- Third-party library code in node_modules

<</SYS>>

Analyze this JavaScript/TypeScript code from {file_path or 'unknown file'}:
```
{code}
```

Additional context:
{enhanced_context}{related_files_context}

Return ONLY a JSON array of issues, no other text.[/INST]"""
        else:
            prompt = f"""[INST]
Analyze the following Python code for security vulnerabilities and critical errors.

**File Path:** {file_path or 'unknown file'}

**Code to Analyze:**
```python
{code}
```

**Instructions:**
1.  Identify critical errors and security vulnerabilities.
2.  Your response MUST be a valid JSON array.
3.  Each object in the array must contain these keys:
    - `line` (integer): The line number of the issue.
    - `severity` (string): "error", "warning", or "security".
    - `message` (string): A concise description of the issue.
    - `suggestion` (string): A specific recommendation for a fix.
4.  Do NOT include explanations, comments, or any text outside the JSON array.

**Example of a valid response:**
[
  {{
    "line": 10,
    "severity": "security",
    "message": "Use of 'eval' is a security risk.",
    "suggestion": "Replace 'eval' with a safer alternative like 'ast.literal_eval' or refactor the logic to avoid dynamic execution."
  }}
]

{enhanced_context}{related_files_context}

**JSON Output Only:**
[/INST]"""

        return prompt

    def _clean_and_parse_json(self, text: str) -> List[Dict[str, Any]]:
        if not text or not isinstance(text, str):
            return []
        
        original_text = text
        json_patterns = [r'\[\s*\{.*\}\s*\]', r'\{\s*"issues"\s*:\s*\[.*\]\s*\}', r'\{.*\}', r'\[.*\]']
        
        try:
            data = json.loads(text)
            return self._extract_issues_from_data(data)
        except json.JSONDecodeError:
            pass
        
        try:
            for pattern in json_patterns:
                match = re.search(pattern, text, re.DOTALL)
                if match:
                    json_str = match.group(0).strip()
                    try:
                        data = json.loads(json_str)
                        issues = self._extract_issues_from_data(data)
                        if issues:
                            return issues
                    except json.JSONDecodeError:
                        continue
        except Exception:
            pass
        
        return [{
            'line': 1,
            'severity': 'error',
            'message': 'Failed to parse AI response',
            'suggestion': 'Check the logs for the raw AI response and update the prompt if needed.'
        }]
    
    def _extract_issues_from_data(self, data: Any) -> List[Dict[str, Any]]:
        if not data:
            return []
        
        try:
            if isinstance(data, list):
                return [issue for issue in (self._validate_issue(item) for item in data) if issue]
            if isinstance(data, dict):
                if 'issues' in data and isinstance(data['issues'], list):
                    return [issue for issue in (self._validate_issue(item) for item in data['issues']) if issue]
                issue = self._validate_issue(data)
                return [issue] if issue else []
        except Exception as e:
            logger.error(f"Error extracting issues from data: {e}", exc_info=True)
        return []
    
    def _classify_severity(self, message: str) -> str:
        """Classify the severity of an issue based on its message."""
        message_lower = message.lower()
        
        # Blocking errors - will prevent app from running
        blocking_errors = [
            'syntax error',
            'import error',
            'module not found',
            'indentation error',
            'name error',
            'type error',
            'value error',
            'key error',
            'attribute error',
            'not defined',
            'missing required',
            'invalid syntax',
            'cannot import',
            'no module named',
            'function not found',
            'class not found',
            'missing parenthesis',
            'unexpected indent',
            'expected an indented block',
            'blueprint not registered',
            'app factory not found',
            'create_app not found'
        ]
        
        # Security issues - won't prevent running but are important
        security_issues = [
            'vulnerability',
            'injection',
            'xss',
            'csrf',
            'clickjacking',
            'directory traversal',
            'path traversal',
            'command injection',
            'code injection',
            'sql injection',
            'eval',
            'exec',
            'pickle',
            'yaml.load',
            'subprocess',
            'shell=true',
            'os.system',
            'os.popen',
            'hardcoded secret',
            'hardcoded password',
            'hardcoded token',
            'hardcoded key',
            'hardcoded credential',
            'exposed port',
            'exposed host',
            '0.0.0.0',
            'dotenv',
            'environment variable',
            'os.getenv',
            'os.environ'
        ]
        
        if any(error in message_lower for error in blocking_errors):
            return 'error'
        if any(issue in message_lower for issue in security_issues):
            return 'security'
        return 'warning'
    
    def _validate_issue(self, issue: Any, file_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Validate and normalize an issue dictionary with three severity levels."""
        if not isinstance(issue, dict):
            return None
            
        message = str(issue.get('message', ''))
        
        # Skip style and formatting issues
        skip_phrases = [
            'unused import',
            'unused variable',
            'line too long',
            'missing docstring',
            'trailing whitespace',
            'missing whitespace',
            'unnecessary',
            'redefinition',
            'redefined',
            'redundant',
            'not in snake_case',
            'not in lowercase',
            'blank line',
            'whitespace',
            'missing final newline',
            'too many',
            'too few',
            'line break',
            'trailing newlines',
            'trailing spaces',
            'trailing comma',
            'missing blank line',
            'multiple imports',
            'multiple statements',
            'multiple spaces',
            'unexpected spaces',
            'unexpected indentation',
            'bad quotes',
            'bad indentation',
            'bad continuation',
            'bad quotes',
            'bad whitespace',
            'bad backslash',
            'bad escape sequence',
            'bad operator',
            'bad except order',
            'bad class attribute',
            'bad staticmethod',
            'bad super call',
            'bad exception context',
            'bad string format type',
            'bad string format',
            'bad string format character',
            'bad string format field',
            'bad string format key',
            'bad string format value',
            'bad string format converter',
            'bad string format specifier',
            'bad string format field name',
            'bad string format field attribute',
            'bad string format field element',
            'bad string format field key',
            'bad string format field value',
            'bad string format field width',
            'bad string format field precision',
            'bad string format field type',
            'bad string format field conversion',
            'bad string format field format_spec',
            'bad string format field replacement',
            'bad string format field mapping',
            'bad string format field mapping key',
            'bad string format field mapping value',
            'bad string format field mapping pair',
            'bad string format field mapping key value',
            'bad string format field mapping key value pair',
            'bad string format field mapping key value pairs',
            'bad string format field mapping key value pairs list',
            'bad string format field mapping key value pairs list item',
            'bad string format field mapping key value pairs list items',
            'bad string format field mapping key value pairs list items list',
            'bad string format field mapping key value pairs list items list item',
            'bad string format field mapping key value pairs list items list items',
            'bad string format field mapping key value pairs list items list items list',
            'bad string format field mapping key value pairs list items list items list item',
            'bad string format field mapping key value pairs list items list items list items'
        ]
        
        if any(phrase in message.lower() for phrase in skip_phrases):
            return None
            
        # Determine severity
        severity = self._classify_severity(message)
        
        validated = {
            'severity': severity,
            'line': int(issue.get('line', 1)),
            'message': message,
            'suggestion': str(issue.get('suggestion', '')),
            'code': str(issue.get('code', 'AI_ANALYSIS')),
            'file': file_path or str(issue.get('file', '')),
            'column': int(issue.get('column', 0)),
            'tool': 'shard-ai'
        }
        
        return validated

    def _find_project_root(self, file_path: str) -> Optional[str]:
        """Find the project root directory."""
        current_dir = os.path.dirname(os.path.abspath(file_path))
        
        # Look for common project indicators
        indicators = [
            'package.json', 'requirements.txt', 'setup.py', 'Pipfile',
            'pom.xml', 'build.gradle', 'Cargo.toml', 'go.mod',
            '.git', '.gitignore', 'README.md'
        ]
        
        while current_dir != os.path.dirname(current_dir):  # Not at root
            for indicator in indicators:
                if os.path.exists(os.path.join(current_dir, indicator)):
                    return current_dir
            current_dir = os.path.dirname(current_dir)
        
        return None
    
    def _is_working_code(self, code: str) -> bool:
        return False

    def _save_response(self, response_text: str, file_name: str):
        """Save the AI's raw response to a text file for debugging."""
        try:
            # Ensure the directory exists
            log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
            os.makedirs(log_dir, exist_ok=True)
            
            file_path = os.path.join(log_dir, file_name)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(response_text)
            logger.info(f"Saved AI response to {file_path}")
        except Exception as e:
            logger.error(f"Failed to save AI response: {e}")

    def _deduplicate_issues(self, issues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate issues based on file, line, and message."""
        unique_issues = []
        seen = set()
        
        for issue in issues:
            # Create a unique key for each issue
            issue_key = (issue.get('file'), issue.get('line'), issue.get('message'))
            if issue_key not in seen:
                unique_issues.append(issue)
                seen.add(issue_key)
                
        return unique_issues

