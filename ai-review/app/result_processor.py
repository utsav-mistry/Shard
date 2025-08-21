import json
import logging
from typing import List, Dict, Any
from collections import defaultdict

logger = logging.getLogger(__name__)

class ResultProcessor:
    """Post-processing layer to merge, deduplicate and rank code analysis results"""
    
    SEVERITY_PRIORITY = {
        'security': 4,
        'error': 3,
        'warning': 2,
        'style': 1,
        'info': 1
    }
    
    def __init__(self):
        pass
    
    def merge_results(self, linter_issues: List[Dict], deepseek_issues: List[Dict]) -> List[Dict]:
        """Merge linter and DeepSeek results, deduplicate and rank by severity"""
        
        # Normalize linter issues to match DeepSeek format
        normalized_linter = self._normalize_linter_issues(linter_issues)
        
        # Normalize DeepSeek issues
        normalized_deepseek = self._normalize_deepseek_issues(deepseek_issues)
        
        # Combine all issues
        all_issues = normalized_linter + normalized_deepseek
        
        # Deduplicate similar issues
        deduplicated = self._deduplicate_issues(all_issues)
        
        # Sort by severity and line number
        sorted_issues = self._sort_by_priority(deduplicated)
        
        return sorted_issues
    
    def _normalize_linter_issues(self, issues: List[Dict]) -> List[Dict]:
        """Normalize linter issues to standard format"""
        normalized = []
        
        for issue in issues:
            normalized_issue = {
                'tool': issue.get('tool', 'unknown'),
                'severity': self._map_severity(issue.get('severity', 'info')),
                'file': issue.get('file', ''),
                'line': issue.get('line', 0),
                'column': issue.get('column', 0),
                'code': issue.get('code', ''),
                'message': issue.get('message', ''),
                'suggestion': issue.get('suggestion', '')
            }
            normalized.append(normalized_issue)
            
        return normalized
    
    def _normalize_deepseek_issues(self, issues: List[Dict]) -> List[Dict]:
        """Normalize DeepSeek issues to standard format"""
        normalized = []
        
        for issue in issues:
            normalized_issue = {
                'tool': 'shard-ai',
                'severity': self._map_severity(issue.get('severity', 'info')),
                'file': '',  # DeepSeek doesn't specify file in current implementation
                'line': issue.get('line', 0),
                'column': 0,
                'code': 'AI_ANALYSIS',
                'message': issue.get('message', ''),
                'suggestion': issue.get('suggestion', '')
            }
            normalized.append(normalized_issue)
            
        return normalized
    
    def _map_severity(self, severity: str) -> str:
        """Map various severity formats to standard format"""
        severity_map = {
            'high': 'error',
            'medium': 'warning', 
            'low': 'info',
            'critical': 'security',
            'major': 'error',
            'minor': 'warning',
            'trivial': 'style'
        }
        
        return severity_map.get(severity.lower(), severity.lower())
    
    def _deduplicate_issues(self, issues: List[Dict]) -> List[Dict]:
        """Remove duplicate or very similar issues"""
        # Group issues by file and line
        grouped = defaultdict(list)
        
        for issue in issues:
            key = f"{issue['file']}:{issue['line']}"
            grouped[key].append(issue)
        
        deduplicated = []
        
        for key, group in grouped.items():
            if len(group) == 1:
                deduplicated.append(group[0])
            else:
                # If multiple issues on same line, prioritize by severity and tool
                group_sorted = sorted(group, key=lambda x: (
                    -self.SEVERITY_PRIORITY.get(x['severity'], 0),
                    x['tool'] == 'shard-ai'  # Prefer DeepSeek for AI insights
                ))
                
                # Check for similar messages to avoid true duplicates
                unique_messages = set()
                for issue in group_sorted:
                    message_key = issue['message'].lower()[:50]  # First 50 chars
                    if message_key not in unique_messages:
                        unique_messages.add(message_key)
                        deduplicated.append(issue)
        
        return deduplicated
    
    def _sort_by_priority(self, issues: List[Dict]) -> List[Dict]:
        """Sort issues by severity priority, then by line number"""
        return sorted(issues, key=lambda x: (
            -self.SEVERITY_PRIORITY.get(x['severity'], 0),
            x['file'],
            x['line']
        ))
    
    def generate_verdict(self, issues: List[Dict], service: str) -> Dict[str, Any]:
        """Generate deployment verdict based on processed issues"""

        severity_counts = defaultdict(int)
        linter_error_count = 0
        ai_security_issue_count = 0
        has_syntax_error = False

        for issue in issues:
            severity_counts[issue['severity']] += 1
            if issue.get('tool') != 'shard-ai' and issue.get('severity') == 'error':
                linter_error_count += 1
            if issue.get('tool') == 'shard-ai' and issue.get('severity') == 'security':
                ai_security_issue_count += 1
            if issue.get('code') == 'syntax-error' and issue.get('severity') == 'error':
                has_syntax_error = True

        total_issues = len(issues)

        # Immediately deny if there is a syntax error
        if has_syntax_error:
            return {
                'verdict': 'deny',
                'reason': 'Syntax error(s) found. Code cannot be deployed.',
                'issue_count': total_issues,
                'severity_breakdown': dict(severity_counts),
                'issues': issues
            }

        security_issues = severity_counts['security']
        error_issues = severity_counts['error']
        warning_issues = severity_counts['warning']

        # Decision logic
        if has_syntax_error or error_issues >= 1:
            verdict = 'deny'
            reason = f"Deployment denied due to {error_issues} critical error(s)."
        elif security_issues > 10:
            verdict = 'deny'
            reason = f"Deployment denied due to excessive security vulnerabilities ({security_issues} found)."
        elif warning_issues > 20:
            verdict = 'deny'
            reason = f"Deployment denied due to an excessive number of warnings ({warning_issues} found)."
        elif service == 'ai-review' and ai_security_issue_count > 0 and linter_error_count < 20:
            verdict = 'manual_review'
            reason = f"{ai_security_issue_count} security issue(s) require manual review before deployment."
        else:
            verdict = 'allow'
            reason = f"Code approved. {total_issues} minor issues found."

        return {
            'verdict': verdict,
            'reason': reason,
            'issue_count': total_issues,
            'severity_breakdown': dict(severity_counts),
            'issues': issues
        }
