# AI Review Service - Postman Testing Guide

This guide provides sample requests to test the AI Review Service with lazy model loading.

## Base URL
```
http://localhost:8000
```

## Available Endpoints (Only 2)

### 1. Health Check
**GET** `/health/`

**Response:**
```json
{
    "status": "ok",
    "service": "ai-review",
    "timestamp": "2024-01-20T10:30:00.000000",
    "responseTime": 15.23,
    "system": {
        "platform": "Windows",
        "node": "DESKTOP-ABC123",
        "python_version": "3.9.0"
    },
    "process": {
        "pid": 12345,
        "cpu_percent": 2.5,
        "memory_info": {
            "rss": 104857600,
            "vms": 209715200
        }
    }
}
```

### 2. Code Review (Main Endpoint)
**POST** `/review/`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON) - For Repository Analysis:**
```json
{
    "projectId": "sample-project-123",
    "model_type": "deepseek_lite"
}
```

**Body (JSON) - For Direct Code Analysis:**
```json
{
    "projectId": "test-project",
    "repoPath": "/path/to/repo",
    "model_type": "codellama_lite"
}
```

**Response:**
```json
{
    "verdict": "manual_review",
    "reason": "Multiple security issues found: 2 security issues require review",
    "issue_count": 5,
    "severity_breakdown": {
        "security": 2,
        "error": 1,
        "warning": 2
    },
    "issues": [
        {
            "severity": "security",
            "line": 15,
            "message": "Use of os.system with user input creates command injection vulnerability",
            "suggestion": "Use subprocess.run() with shell=False instead",
            "code": "AI_ANALYSIS",
            "file": "app.py",
            "column": 0,
            "tool": "shard-ai"
        }
    ],
    "linter_count": 3,
    "ai_count": 2,
    "model_used": "deepseek_lite",
    "model_loaded": true
}
```

## Available Models

You can specify any of these models in the `model_type` parameter:
- `deepseek_lite` (default) - Fast, lightweight analysis
- `deepseek_full` - Comprehensive analysis
- `codellama_lite` - Code-focused analysis
- `codellama_full` - Full code analysis
- `mistral_7b` - General purpose analysis
- `falcon_7b` - Advanced analysis

## Testing Workflow

### Step 1: Check Service Health
```bash
curl -X GET http://localhost:8000/health/
```

### Step 2: Test Code Review (First Request - Model Loading)
```bash
curl -X POST http://localhost:8000/review/ \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-001",
    "model_type": "deepseek_lite"
  }'
```

### Step 3: Test with Different Model
```bash
curl -X POST http://localhost:8000/review/ \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-002", 
    "model_type": "codellama_full"
  }'
```

### Step 4: Test with Custom Repo Path
```bash
curl -X POST http://localhost:8000/review/ \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "custom-project",
    "repoPath": "/custom/path/to/repo",
    "model_type": "mistral_7b"
  }'
```

## Expected Behavior

1. **First Analysis Request**: 
   - Model loads on demand (takes longer)
   - Response includes `"model_loaded": true`
   - Subsequent requests with same model are faster

2. **Model Caching**:
   - Once loaded, models stay in memory
   - Performance improves for cached models
   - Different models can be loaded simultaneously

3. **Error Handling**:
   - Invalid model types return available options
   - Missing projectId returns validation error
   - Repository not found returns appropriate error

## Performance Notes

- **First Request**: 5-30 seconds (model loading time)
- **Cached Requests**: 1-5 seconds (inference only)
- **Memory Usage**: Models consume 2-8GB RAM when loaded
- **GPU Usage**: Models require CUDA-compatible GPU

## Troubleshooting

### Common Issues:

1. **GPU Not Available**:
   ```json
   {
     "error": "GPU not available. Models require GPU for execution."
   }
   ```

2. **Model File Missing**:
   ```json
   {
     "error": "Model file not found at models/deepseek-coder-6.7b-instruct.Q4_K_M.gguf"
   }
   ```

3. **Invalid Model Type**:
   ```json
   {
     "error": "Invalid model type: invalid_model",
     "available_models": ["deepseek_lite", "deepseek_full", "codellama_lite", "codellama_full", "mistral_7b", "falcon_7b"]
   }
   ```

4. **Repository Not Found**:
   ```json
   {
     "error": "Repository not found: No repository found for project ID: test-project in /path/to/repos"
   }
   ```

## Model Files Required

Place these files in `ai-review/models/` directory:
- `deepseek-coder-6.7b-instruct.Q4_K_M.gguf`
- `deepseek-llm-7b-chat.Q4_K_M.gguf`
- `codellama-7b-instruct.Q3_K_M.gguf`
- `codellama-7b-instruct.Q4_K_M.gguf`
- `mistral-7b-instruct-v0.2.Q4_K_M.gguf`
- `falcon-7b-instruct.Q4_K_M.gguf`

## Sample Postman Collection

Import this JSON into Postman:

```json
{
    "info": {
        "name": "AI Review Service",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Health Check",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "http://localhost:8000/health/",
                    "protocol": "http",
                    "host": ["localhost"],
                    "port": "8000",
                    "path": ["health", ""]
                }
            }
        },
        {
            "name": "Code Review - DeepSeek Lite",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"projectId\": \"sample-project-123\",\n    \"model_type\": \"deepseek_lite\"\n}"
                },
                "url": {
                    "raw": "http://localhost:8000/review/",
                    "protocol": "http",
                    "host": ["localhost"],
                    "port": "8000",
                    "path": ["review", ""]
                }
            }
        },
        {
            "name": "Code Review - CodeLlama Full",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"projectId\": \"test-project-456\",\n    \"model_type\": \"codellama_full\"\n}"
                },
                "url": {
                    "raw": "http://localhost:8000/review/",
                    "protocol": "http",
                    "host": ["localhost"],
                    "port": "8000",
                    "path": ["review", ""]
                }
            }
        }
    ]
}
```
