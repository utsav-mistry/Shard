# Deployment Verdict Logic

This document outlines the rules used to determine the deployment verdict (`allow`, `deny`, or `manual_review`) based on the results of the code analysis. The verdicts are evaluated in order of precedence: **Deny**, then **Manual Review**, and finally **Allow**.

---

## Verdict Conditions

| Verdict         | Condition(s)                                                                                             | Description                                                                                               |
| :-------------- | :------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Deny**        | `has_syntax_error == True`                                                                               | At least one syntax error is found.                                                                       |
|                 | `error_issues >= 1`                                                                                      | One or more critical errors are detected.                                                                 |
|                 | `security_issues > 10`                                                                                   | More than 10 security vulnerabilities are found.                                                          |
|                 | `warning_issues > 20`                                                                                    | More than 20 warnings are found.                                                                          |
| **Manual Review** | `service == 'ai-review'` AND<br>`ai_security_issue_count > 0` AND<br>`linter_error_count < 20`              | Triggered for AI-detected security issues when the number of linter-reported errors is low.               |
| **Allow**       | *None of the above conditions are met.*                                                                  | The code is considered safe to deploy.                                                                    |

---

## Updated Verdict Logic

This table reflects the current, simplified logic implemented in `result_processor.py`.

| Verdict         | Condition(s)                                     | Description                                                                 |
| :-------------- | :----------------------------------------------- | :-------------------------------------------------------------------------- |
| **Deny**        | `has_syntax_error == True` OR `error_issues >= 1`  | Denied if any syntax errors or critical errors are found.                   |
|                 | `security_issues > 10`                           | Denied for excessive security vulnerabilities.                              |
|                 | `warning_issues > 20`                            | Denied for an excessive number of warnings.                                 |
| **Manual Review** | `security_issues > 0`                            | Requires manual review if any security issues are present (and not denied). |
| **Allow**       | *None of the above conditions are met.*          | The code is considered safe to deploy.                                      |

---

## Current Implementation 

Based on the actual `result_processor.py` implementation with the `service` parameter:

### Verdict Decision Flow

| Priority | Verdict | Conditions | Implementation Details |
|----------|---------|------------|------------------------|
| 1 | **Deny** | `has_syntax_error == True` | Immediate denial for syntax errors |
| 2 | **Deny** | `error_issues >= 1` | Any critical error triggers denial |
| 3 | **Deny** | `security_issues > 10` | Excessive security vulnerabilities |
| 4 | **Deny** | `warning_issues > 20` | Excessive warnings |
| 5 | **Manual Review** | `service == 'ai-review'` AND<br>`ai_security_issue_count > 0` AND<br>`linter_error_count < 20` | AI-detected security issues with low linter errors |
| 6 | **Allow** | *None of the above* | Default approval |

### Key Variables
- **`linter_error_count`**: Count of errors from non-AI tools (`tool != 'shard-ai'`)
- **`ai_security_issue_count`**: Security issues detected by AI (`tool == 'shard-ai'` and `severity == 'security'`)
- **`service`**: Type of analysis service (`'ai-review'` or `'linter'`)

