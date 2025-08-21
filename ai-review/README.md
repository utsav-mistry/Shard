  # Shard Internal AI Code Review

Internal GPU-accelerated code review service using DeepSeek and other LLMs. Optimized for RTX 3050.

## Supported Models

| Model | Context | GPU Layers | Batch Size | Use Case | Token Usage |
|-------|----------|------------|------------|----------|----------|
| DeepSeek Lite | 1024 | 24 | 256 | Quick Reviews |10|
| DeepSeek Full | 2048 | 32 | 128 | Complex Analysis |20|
| CodeLlama Lite | 1024 | 28 | 64 | Web Apps |25|
| CodeLlama Full | 2048 | 36 | 64 | Deep Analysis |30|
| Mistral 7B | 1024 | 28 | 128 | General Code |50|
| Falcon 7B | 4096 | 32 | 128 | Large Files |100|

## Implementation Details

### Model Runner
- Lazy loading of models
- GPU-only execution (no CPU fallback)
- CuPy-based GPU validation
- Enhanced context window management
- Token usage optimization
- Automatic model unloading

### Preprocessing Pipeline
- AST-based parsing
- Token-aware chunking
- Project context extraction
- Import dependency analysis
- Multi-file context building

### Analysis Features
- Security vulnerability detection
- Runtime error prediction
- Type consistency checking
- Import validation
- Dependency analysis
- Project-wide context

## Security Notes

- Service runs on internal network only
- Requires GPU authentication
- Model files are checksummed
- No external API access
- Automatic prompt sanitization

## Internal Links

- Metrics Dashboard: /health/