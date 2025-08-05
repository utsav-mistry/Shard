import os

# Supported source file extensions
VALID_EXTENSIONS = ('.py', '.js', '.jsx', '.ts', '.tsx')

# Absolute path to cloned repos
BASE_REPO_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../deployment-worker/repos/")
)

def collect_code_files(project_id):
    repo_path = os.path.join(BASE_REPO_DIR, project_id)
    collected = []

    if not os.path.isdir(repo_path):
        raise FileNotFoundError(f"Repository not found at {repo_path}")

    for root, _, files in os.walk(repo_path):
        for fname in files:
            if fname.endswith(VALID_EXTENSIONS):
                full_path = os.path.join(root, fname)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        collected.append({
                            "file_path": full_path,
                            "content": content
                        })
                except Exception as e:
                    print(f"[ERROR] Reading {full_path}: {e}")

    return collected
