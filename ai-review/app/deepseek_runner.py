import json
import os
import logging
from typing import List, Dict, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)

class DeepSeekRunner:
    """Wrapper class for DeepSeek AI code analysis functionality."""
    
    def __init__(self):
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the AI model if available."""
        # Try to import llama_cpp, fallback to None if not available
        try:
            from llama_cpp import Llama
            
            # Path to the quantized DeepSeek model
            model_path = os.getenv('AI_MODEL_PATH', 'models/deepseek.gguf')
            
            if os.path.exists(model_path):
                try:
                    self.model = Llama(
                        model_path=model_path,
                        n_ctx=int(os.getenv('AI_MODEL_CONTEXT', '2048')),
                        n_threads=int(os.getenv('AI_MODEL_THREADS', '6')),
                        n_gpu_layers=int(os.getenv('AI_MODEL_GPU_LAYERS', '10')),
                        use_mlock=True,
                        use_mmap=True
                    )
                    logger.info(f"AI model loaded successfully from {model_path}")
                except Exception as e:
                    logger.error(f"Failed to load AI model: {e}")
                    self.model = None
            else:
                logger.warning(f"AI model not found at {model_path}")
        except ImportError:
            logger.warning("llama_cpp not available, using fallback analysis")
            self.model = None
    
    def analyze_code(self, code: str, file_path: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Analyze code for issues using AI model or pattern matching fallback.
        
        Args:
            code: The source code to analyze
            file_path: Optional file path for logging purposes
            
        Returns:
            List of issues found in the code
        """
        if file_path:
            logger.debug(f"Analyzing code from {file_path}")
            
        # If AI model is available, use it
        if self.model is not None:
            return self._analyze_with_ai(code)
        else:
            # Fallback to pattern-based analysis
            return _analyze_with_patterns(code)
    
    def _analyze_with_ai(self, code: str) -> List[Dict[str, Any]]:
        """Analyze code using AI model."""
        prompt = (
            "You are a code security and quality analyzer. Analyze the following code and return ONLY a valid JSON array of issues found.\n\n"
            "Each issue must have this exact structure:\n"
            "{\n"
            '  "severity": "security|error|warning|style",\n'
            '  "line": <line_number>,\n'
            '  "message": "Brief description of the issue",\n'
            '  "suggestion": "How to fix this issue"\n'
            '}\n\n'
            "File: \n"
            "Code:\n"
            f"{code}\n\n"
            "Focus on:\n"
            "- Security vulnerabilities (SQL injection, XSS, eval usage, etc.)\n"
            "- Logic errors and bugs\n"
            "- Performance issues\n"
            "- Code style violations\n\n"
            "Return only the JSON array, no other text:"
        )

        try:
            output = self.model(
                prompt=prompt, 
                max_tokens=1024, 
                stop=["\n\n", "</end>"],
                temperature=0.3
            )
            response = output["choices"][0]["text"].strip()
            
            # Extract JSON from response
            start = response.find("[")
            end = response.rfind("]") + 1
            
            if start == -1 or end == 0:
                logger.warning("AI model did not return valid JSON array")
                return []
                
            json_data = response[start:end]
            issues = json.loads(json_data)
            
            # Validate and clean issues
            validated_issues = []
            for issue in issues:
                if isinstance(issue, dict) and all(k in issue for k in ['severity', 'line', 'message', 'suggestion']):
                    validated_issues.append(issue)
                    
            logger.info(f"AI analysis found {len(validated_issues)} issues")
            return validated_issues
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            return [{
                "severity": "error",
                "line": 0,
                "message": "AI model returned invalid JSON response",
                "suggestion": "Check AI model output for errors"
            }]
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return [{
                "severity": "error",
                "line": 0,
                "message": f"AI model failed: {str(e)}",
                "suggestion": "Check AI model for errors"
            }]

def get_code_issues(code: str) -> List[Dict[str, Any]]:
    """Legacy function to maintain backward compatibility."""
    runner = DeepSeekRunner()
    return runner.analyze_code(code)

def _analyze_with_patterns(code: str) -> List[Dict[str, Any]]:
    """Fallback pattern-based code analysis."""
    issues = []
    lines = code.split('\n')
    
    # Common security and quality patterns
    patterns = [
        {
            'pattern': r'eval\s*\(',
            'type': 'security_vulnerability',
            'advice': 'Avoid using eval() as it can execute arbitrary code',
            'severity': 'high'
        },
        {
            'pattern': r'innerHTML\s*=.*\+',
            'type': 'xss_vulnerability',
            'advice': 'Potential XSS vulnerability with innerHTML concatenation',
            'severity': 'high'
        },
        {
            'pattern': r'document\.write\s*\(',
            'type': 'deprecated_method',
            'advice': 'document.write is deprecated and can cause issues',
            'severity': 'medium'
        },
        {
            'pattern': r'var\s+\w+\s*=\s*\w+\s*\|\|\s*\{\}',
            'type': 'potential_issue',
            'advice': 'Consider using more explicit default value assignment',
            'severity': 'low'
        },
        {
            'pattern': r'console\.log\s*\(',
            'type': 'debug_code',
            'advice': 'Remove console.log statements before production deployment',
            'severity': 'low'
        },
        {
            'pattern': r'TODO|FIXME|HACK',
            'type': 'incomplete_code',
            'advice': 'Address TODO/FIXME comments before deployment',
            'severity': 'medium'
        }
    ]
    
    import re
    for line_num, line in enumerate(lines, 1):
        for pattern_info in patterns:
            if re.search(pattern_info['pattern'], line, re.IGNORECASE):
                issues.append({
                    'line': line_num,
                    'type': pattern_info['type'],
                    'advice': pattern_info['advice'],
                    'severity': pattern_info['severity']
                })
    
    logger.info(f"Pattern analysis found {len(issues)} issues")
    return issues
