# Shard AI Review Service

This is the AI code review service for Shard, a modern deployment platform for web applications. The AI review service analyzes code for security vulnerabilities, bad practices, and potential issues before deployment.

## Features

- **Automated Code Analysis**
  - Security vulnerability detection
  - Bad practice identification
  - Code quality assessment
  - Typo and error detection

- **DeepSeek AI Integration**
  - Powered by DeepSeek code model
  - Local inference using llama.cpp
  - Optimized for performance with GPU acceleration

- **Multi-language Support**
  - Python (.py)
  - JavaScript (.js, .jsx)
  - TypeScript (.ts, .tsx)

- **Deployment Verdict System**
  - Automatic approval for clean code
  - Manual review recommendation for minor issues
  - Automatic rejection for serious security concerns

- **REST API**
  - Simple API for integration with deployment pipeline
  - JSON response format with detailed issue reporting

## Getting Started

### Prerequisites

- Python 3.12 or later
- Django 5.2 or later
- CUDA-compatible GPU (recommended for performance)
- DeepSeek model file (GGUF format)

### Installation

1. Clone the repository
2. Navigate to the ai-review directory:
   ```bash
   cd ai-review
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Download the DeepSeek model:
   ```bash
   mkdir -p models
   # Download DeepSeek GGUF model to models/deepseek.gguf
   ```

### Running the Service

```bash
python manage.py runserver 0.0.0.0:10000
```

The AI review service will be available at [http://localhost:10000](http://localhost:10000).

## Project Structure

```
ai-review/
├── ai_review/          # Django project settings
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py     # Django configuration
│   ├── urls.py         # URL routing
│   └── wsgi.py
├── app/                # Main application
│   ├── __init__.py
│   ├── admin.py
│   ├── analyzer.py     # Code analysis logic
│   ├── apps.py
│   ├── deepseek_runner.py  # AI model integration
│   ├── migrations/
│   ├── models.py
│   ├── tests.py
│   ├── utils.py        # Utility functions
│   └── views.py        # API endpoints
├── manage.py           # Django management script
├── models/             # Directory for AI models (created at runtime)
│   └── deepseek.gguf   # DeepSeek model file (download separately)
└── templates/          # HTML templates
    ├── 404.html        # Error pages
    ├── 405.html
    ├── 500.html
    └── root.html       # Root page template
```

## API Endpoints

### Code Review

- `POST /review/` - Submit code for review
  - Required fields: `projectId`
  - Response: JSON with verdict and issues

### Example Response

```json
{
  "projectId": "123456",
  "verdict": "manual_review",
  "issueCount": 3,
  "aiIssueCount": 3,
  "patternIssueCount": 0,
  "issues": [
    {
      "file": "/path/to/file.js",
      "line": 42,
      "type": "security_vulnerability",
      "advice": "Avoid using eval() as it can lead to code injection attacks",
      "source": "ai"
    },
    {
      "file": "/path/to/file.js",
      "line": 57,
      "type": "bad_practice",
      "advice": "Use const instead of var for better scoping",
      "source": "ai"
    }
  ]
}
```

## Verdict Logic

The AI review service uses the following logic to determine the deployment verdict:

- **allow**: No issues found
- **manual_review**: 1-5 issues found
- **deny**: More than 5 issues found

## Integration with Deployment Worker

The AI review service is called by the deployment worker during the deployment process. If the verdict is "deny", the deployment is automatically rejected. If the verdict is "manual_review", the deployment is flagged for human review.

## Performance Optimization

The DeepSeek model is loaded once globally and kept in memory for fast inference. The service uses GPU acceleration if available, with configurable parameters for threads and GPU layers.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.