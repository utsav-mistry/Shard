"""
Enhanced context analyzer for multi-file code analysis.
Handles connected dependencies and provides better context to AI models.
"""

import os
import ast
import re
import logging
from typing import Dict, List, Set, Optional, Any, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)

class ContextAnalyzer:
    """Analyzes code context across multiple files to improve AI analysis."""
    
    def __init__(self):
        self.file_dependencies = {}
        self.import_graph = {}
        self.function_definitions = {}
        self.class_definitions = {}
        self.variable_definitions = {}
    
    def analyze_project_context(self, project_path: str, target_file: str) -> Dict[str, Any]:
        """
        Analyze the entire project context for better AI understanding.
        
        Args:
            project_path: Root path of the project
            target_file: The file being analyzed
            
        Returns:
            Dictionary containing project context information
        """
        context = {
            "target_file": target_file,
            "related_files": {},
            "dependencies": [],
            "imports": [],
            "exports": [],
            "functions": [],
            "classes": [],
            "variables": [],
            "file_structure": {},
            "tech_stack": self._detect_tech_stack(project_path)
        }
        
        try:
            # Get all relevant files
            relevant_files = self._get_relevant_files(project_path, target_file)
            
            # Analyze each file
            for file_path in relevant_files:
                file_info = self._analyze_file(file_path)
                if file_info:
                    rel_path = os.path.relpath(file_path, project_path)
                    context["related_files"][rel_path] = file_info
            
            # Build dependency graph
            context["dependencies"] = self._build_dependency_graph(context["related_files"])
            
            # Extract target file specific context
            target_rel_path = os.path.relpath(target_file, project_path)
            if target_rel_path in context["related_files"]:
                target_info = context["related_files"][target_rel_path]
                context["imports"] = target_info.get("imports", [])
                context["exports"] = target_info.get("exports", [])
                context["functions"] = target_info.get("functions", [])
                context["classes"] = target_info.get("classes", [])
                context["variables"] = target_info.get("variables", [])
            
            # Get file structure
            context["file_structure"] = self._get_file_structure(project_path)
            
        except Exception as e:
            logger.error(f"Error analyzing project context: {e}")
        
        return context
    
    def _get_relevant_files(self, project_path: str, target_file: str, max_files: int = 10) -> List[str]:
        """Get files most relevant to the target file."""
        relevant_files = [target_file]
        
        # Get files in the same directory
        target_dir = os.path.dirname(target_file)
        try:
            for file in os.listdir(target_dir):
                file_path = os.path.join(target_dir, file)
                if self._is_code_file(file_path) and file_path != target_file:
                    relevant_files.append(file_path)
                    if len(relevant_files) >= max_files:
                        break
        except OSError:
            pass
        
        # Get common project files
        common_files = [
            "package.json", "requirements.txt", "setup.py", "Dockerfile",
            "docker-compose.yml", ".env.example", "README.md",
            "app.py", "main.py", "index.js", "server.js", "app.js"
        ]
        
        for common_file in common_files:
            common_path = os.path.join(project_path, common_file)
            if os.path.exists(common_path) and common_path not in relevant_files:
                relevant_files.append(common_path)
                if len(relevant_files) >= max_files:
                    break
        
        return relevant_files[:max_files]
    
    def _is_code_file(self, file_path: str) -> bool:
        """Check if file is a code file."""
        code_extensions = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.h',
            '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
            '.html', '.css', '.scss', '.sass', '.less', '.vue', '.svelte'
        }
        return Path(file_path).suffix.lower() in code_extensions
    
    def _analyze_file(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Analyze a single file for context information."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            file_ext = Path(file_path).suffix.lower()
            
            if file_ext == '.py':
                return self._analyze_python_file(content, file_path)
            elif file_ext in ['.js', '.jsx', '.ts', '.tsx']:
                return self._analyze_javascript_file(content, file_path)
            else:
                return self._analyze_generic_file(content, file_path)
                
        except Exception as e:
            logger.error(f"Error analyzing file {file_path}: {e}")
            return None
    
    def _analyze_python_file(self, content: str, file_path: str) -> Dict[str, Any]:
        """Analyze Python file for imports, functions, classes, etc."""
        info = {
            "type": "python",
            "imports": [],
            "exports": [],
            "functions": [],
            "classes": [],
            "variables": [],
            "content_preview": content[:500] + "..." if len(content) > 500 else content
        }
        
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        info["imports"].append({
                            "name": alias.name,
                            "alias": alias.asname,
                            "type": "import"
                        })
                
                elif isinstance(node, ast.ImportFrom):
                    module = node.module or ""
                    for alias in node.names:
                        info["imports"].append({
                            "name": f"{module}.{alias.name}" if module else alias.name,
                            "alias": alias.asname,
                            "type": "from_import",
                            "module": module
                        })
                
                elif isinstance(node, ast.FunctionDef):
                    info["functions"].append({
                        "name": node.name,
                        "args": [arg.arg for arg in node.args.args],
                        "line": node.lineno,
                        "is_async": isinstance(node, ast.AsyncFunctionDef)
                    })
                
                elif isinstance(node, ast.ClassDef):
                    info["classes"].append({
                        "name": node.name,
                        "bases": [base.id if isinstance(base, ast.Name) else str(base) for base in node.bases],
                        "line": node.lineno
                    })
                
                elif isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            info["variables"].append({
                                "name": target.id,
                                "line": node.lineno,
                                "type": "assignment"
                            })
        
        except SyntaxError as e:
            logger.warning(f"Syntax error in {file_path}: {e}")
            info["syntax_error"] = str(e)
        
        return info
    
    def _analyze_javascript_file(self, content: str, file_path: str) -> Dict[str, Any]:
        """Analyze JavaScript/TypeScript file for imports, functions, etc."""
        info = {
            "type": "javascript",
            "imports": [],
            "exports": [],
            "functions": [],
            "classes": [],
            "variables": [],
            "content_preview": content[:500] + "..." if len(content) > 500 else content
        }
        
        # Extract imports
        import_patterns = [
            r'import\s+(?:(?:\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+)?[\'"]([^\'"]+)[\'"]',
            r'require\([\'"]([^\'"]+)[\'"]\)',
            r'import\([\'"]([^\'"]+)[\'"]\)'
        ]
        
        for pattern in import_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                info["imports"].append({
                    "name": match.group(1),
                    "type": "import"
                })
        
        # Extract exports
        export_patterns = [
            r'export\s+(?:default\s+)?(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|let\s+(\w+)|var\s+(\w+))',
            r'module\.exports\s*=\s*(\w+)',
            r'exports\.(\w+)\s*='
        ]
        
        for pattern in export_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                name = next((g for g in match.groups() if g), "unknown")
                info["exports"].append({
                    "name": name,
                    "type": "export"
                })
        
        # Extract functions
        function_patterns = [
            r'function\s+(\w+)\s*\(',
            r'const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>',
            r'(\w+)\s*:\s*(?:async\s+)?function\s*\(',
            r'async\s+function\s+(\w+)\s*\('
        ]
        
        for pattern in function_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                info["functions"].append({
                    "name": match.group(1),
                    "type": "function"
                })
        
        # Extract classes
        class_matches = re.finditer(r'class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{', content, re.MULTILINE)
        for match in class_matches:
            info["classes"].append({
                "name": match.group(1),
                "extends": match.group(2),
                "type": "class"
            })
        
        return info
    
    def _analyze_generic_file(self, content: str, file_path: str) -> Dict[str, Any]:
        """Analyze generic file for basic information."""
        return {
            "type": "generic",
            "content_preview": content[:300] + "..." if len(content) > 300 else content,
            "line_count": len(content.splitlines()),
            "size": len(content)
        }
    
    def _build_dependency_graph(self, files_info: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Build dependency relationships between files."""
        dependencies = []
        
        for file_path, file_info in files_info.items():
            imports = file_info.get("imports", [])
            for imp in imports:
                # Try to resolve import to actual file
                resolved_file = self._resolve_import(imp["name"], file_path, files_info)
                if resolved_file:
                    dependencies.append({
                        "from": file_path,
                        "to": resolved_file,
                        "import": imp["name"],
                        "type": imp.get("type", "unknown")
                    })
        
        return dependencies
    
    def _resolve_import(self, import_name: str, current_file: str, files_info: Dict[str, Dict[str, Any]]) -> Optional[str]:
        """Try to resolve an import to an actual file."""
        # Simple resolution - look for files with matching names
        for file_path in files_info.keys():
            file_name = Path(file_path).stem
            if file_name == import_name or import_name.endswith(file_name):
                return file_path
        return None
    
    def _detect_tech_stack(self, project_path: str) -> Dict[str, Any]:
        """Detect the technology stack of the project."""
        tech_stack = {
            "languages": set(),
            "frameworks": set(),
            "tools": set(),
            "package_managers": set()
        }
        
        # Check for common files
        indicators = {
            "package.json": {"languages": ["javascript"], "package_managers": ["npm"]},
            "requirements.txt": {"languages": ["python"], "package_managers": ["pip"]},
            "Pipfile": {"languages": ["python"], "package_managers": ["pipenv"]},
            "setup.py": {"languages": ["python"]},
            "Dockerfile": {"tools": ["docker"]},
            "docker-compose.yml": {"tools": ["docker-compose"]},
            "yarn.lock": {"package_managers": ["yarn"]},
            "pom.xml": {"languages": ["java"], "package_managers": ["maven"]},
            "build.gradle": {"languages": ["java"], "package_managers": ["gradle"]},
            "Cargo.toml": {"languages": ["rust"], "package_managers": ["cargo"]},
            "go.mod": {"languages": ["go"], "package_managers": ["go"]},
        }
        
        for file_name, stack_info in indicators.items():
            file_path = os.path.join(project_path, file_name)
            if os.path.exists(file_path):
                for category, items in stack_info.items():
                    tech_stack[category].update(items)
        
        # Check for framework indicators in package.json
        package_json_path = os.path.join(project_path, "package.json")
        if os.path.exists(package_json_path):
            try:
                import json
                with open(package_json_path, 'r') as f:
                    package_data = json.load(f)
                
                dependencies = {**package_data.get("dependencies", {}), 
                              **package_data.get("devDependencies", {})}
                
                framework_indicators = {
                    "react": "React",
                    "vue": "Vue.js",
                    "angular": "Angular",
                    "express": "Express.js",
                    "next": "Next.js",
                    "nuxt": "Nuxt.js",
                    "svelte": "Svelte",
                    "gatsby": "Gatsby",
                    "webpack": "Webpack",
                    "vite": "Vite",
                    "typescript": "TypeScript"
                }
                
                for dep, framework in framework_indicators.items():
                    if any(dep in key.lower() for key in dependencies.keys()):
                        tech_stack["frameworks"].add(framework)
                        
            except Exception as e:
                logger.error(f"Error reading package.json: {e}")
        
        # Convert sets to lists for JSON serialization
        return {k: list(v) for k, v in tech_stack.items()}
    
    def _get_file_structure(self, project_path: str, max_depth: int = 3) -> Dict[str, Any]:
        """Get project file structure."""
        structure = {}
        
        try:
            for root, dirs, files in os.walk(project_path):
                # Skip hidden directories and common ignore patterns
                dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'venv', 'env']]
                
                level = root.replace(project_path, '').count(os.sep)
                if level >= max_depth:
                    dirs[:] = []
                    continue
                
                rel_root = os.path.relpath(root, project_path)
                if rel_root == '.':
                    rel_root = 'root'
                
                structure[rel_root] = {
                    "directories": dirs[:10],  # Limit to first 10
                    "files": [f for f in files if not f.startswith('.')][:20]  # Limit to first 20
                }
        
        except Exception as e:
            logger.error(f"Error getting file structure: {e}")
        
        return structure
    
    def get_enhanced_context_for_ai(self, project_path: str, target_file: str, 
                                   max_context_length: int = 3000) -> str:
        """
        Get enhanced context string for AI analysis.
        
        Args:
            project_path: Root path of the project
            target_file: The file being analyzed
            max_context_length: Maximum length of context to return
            
        Returns:
            Formatted context string for AI
        """
        context = self.analyze_project_context(project_path, target_file)
        
        context_parts = []
        
        # Tech stack information
        if context["tech_stack"]:
            tech_info = []
            for category, items in context["tech_stack"].items():
                if items:
                    tech_info.append(f"{category}: {', '.join(items)}")
            if tech_info:
                context_parts.append(f"Tech Stack: {'; '.join(tech_info)}")
        
        # File structure
        if context["file_structure"]:
            structure_info = []
            for path, info in list(context["file_structure"].items())[:3]:  # Top 3 directories
                if info["files"]:
                    structure_info.append(f"{path}: {', '.join(info['files'][:5])}")
            if structure_info:
                context_parts.append(f"Project Structure: {'; '.join(structure_info)}")
        
        # Dependencies
        if context["dependencies"]:
            deps = [f"{dep['from']} imports {dep['import']}" for dep in context["dependencies"][:5]]
            context_parts.append(f"Dependencies: {'; '.join(deps)}")
        
        # Related files with content
        if context["related_files"]:
            for file_path, file_info in list(context["related_files"].items())[:3]:
                if file_path != os.path.relpath(target_file, project_path):
                    preview = file_info.get("content_preview", "")
                    if preview:
                        context_parts.append(f"Related file {file_path}:\n{preview[:400]}...")
        
        # Join all context parts
        full_context = "\n\n".join(context_parts)
        
        # Truncate if too long
        if len(full_context) > max_context_length:
            full_context = full_context[:max_context_length] + "...[truncated]"
        
        return full_context

# Global context analyzer instance
context_analyzer = ContextAnalyzer()
