import os
import logging
from typing import List, Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

# Supported source file extensions
VALID_EXTENSIONS = ('.py', '.js', '.jsx', '.ts', '.tsx')

# Files and directories to skip
SKIP_DIRS = {'node_modules', '.git', '__pycache__', '.venv', 'venv', 'env', 'dist', 'build', '.next', 'target', 'vendor'}
SKIP_FILES = {'.env', '.env.local', '.env.production', 'package-lock.json', 'yarn.lock', 'Pipfile.lock'}

# Absolute path to cloned repos
BASE_REPO_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../deployment-worker/repos/")
)

def collect_code_files(project_id: str) -> List[Dict[str, Any]]:
    """Collect code files from project repository using project ID."""
    repo_path = os.path.join(BASE_REPO_DIR, project_id)
    return collect_code_files_from_path(repo_path)

def collect_code_files_from_path(repo_path: str) -> List[Dict[str, Any]]:
    """Collect code files from a given repository path."""
    collected = []
    
    if not os.path.isdir(repo_path):
        raise FileNotFoundError(f"Repository not found at {repo_path}")

    file_count = 0
    max_files = int(os.getenv('MAX_FILES_TO_ANALYZE', '50'))  # Limit files to analyze
    max_file_size = int(os.getenv('MAX_FILE_SIZE_KB', '100')) * 1024  # 100KB default
    
    for root, dirs, files in os.walk(repo_path):
        # Skip certain directories
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        
        for fname in files:
            if file_count >= max_files:
                logger.warning(f"Reached maximum file limit ({max_files}), stopping analysis")
                break
                
            if fname in SKIP_FILES:
                continue
                
            if fname.endswith(VALID_EXTENSIONS):
                full_path = os.path.join(root, fname)
                
                try:
                    # Check file size
                    file_size = os.path.getsize(full_path)
                    if file_size > max_file_size:
                        logger.info(f"Skipping large file {full_path} ({file_size} bytes)")
                        continue
                    
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        
                        # Skip empty files or files with only whitespace
                        if not content.strip():
                            continue
                            
                        collected.append({
                            "file_path": full_path,
                            "content": content,
                            "size": file_size,
                            "extension": os.path.splitext(fname)[1]
                        })
                        file_count += 1
                        
                except Exception as e:
                    logger.error(f"Error reading {full_path}: {e}")
                    # Add error entry for tracking
                    collected.append({
                        "file_path": full_path,
                        "content": "",
                        "error": str(e),
                        "size": 0,
                        "extension": os.path.splitext(fname)[1]
                    })
        
        if file_count >= max_files:
            break
    
    logger.info(f"Collected {len(collected)} files for analysis from {repo_path}")
    return collected
