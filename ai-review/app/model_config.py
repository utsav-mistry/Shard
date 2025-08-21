"""
Simplified model configuration for Shard AI Review Service.
Strict GPU mode (RTX 3050) – no CPU fallback.
"""

import logging
import os
import sys
import platform
import subprocess
from typing import Dict, Optional, Any
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class ModelType(Enum):
    DEEPSEEK_LITE = "deepseek_lite"
    DEEPSEEK_FULL = "deepseek_full"
    CODELLAMA_LITE = "codellama_lite"
    CODELLAMA_FULL = "codellama_full"
    MISTRAL_7B = "mistral_7b"
    FALCON_7B = "falcon_7b"

@dataclass
class ModelConfig:
    name: str
    model_path: str
    context_length: int
    gpu_layers: int
    n_batch: int
    temperature: float
    max_tokens: int

class ModelManager:
    """Strict GPU-only model manager with lazy initialization."""

    def __init__(self):
        self.strict_gpu_only = True  # Enforce GPU-only mode
        self.model_configs = self._initialize_model_configs()
        self._loaded_models = {}  # Cache for loaded models

    def _initialize_model_configs(self) -> Dict[ModelType, ModelConfig]:
        return {
            ModelType.DEEPSEEK_LITE: ModelConfig(
                name="DeepSeek Coder Lite",
                model_path="models/deepseek-coder-6.7b-instruct.Q4_K_M.gguf",
                context_length=1024,      
                gpu_layers=24,            
                n_batch=256,              
                temperature=0.2,
                max_tokens=1000
            ),
            ModelType.DEEPSEEK_FULL: ModelConfig(
                name="DeepSeek Coder Full",
                model_path="models/deepseek-llm-7b-chat.Q4_K_M.gguf",
                context_length=2048,      
                gpu_layers=32,            
                n_batch=128,
                temperature=0.2,
                max_tokens=1500
            ),
            ModelType.CODELLAMA_LITE: ModelConfig(
                name="CodeLlama Lite",
                model_path="models/codellama-7b-instruct.Q3_K_M.gguf",
                context_length=1024,      
                gpu_layers=28,            
                n_batch=64,
                temperature=0.1,
                max_tokens=1200
            ),
            ModelType.CODELLAMA_FULL: ModelConfig(
                name="CodeLlama Full",
                model_path="models/codellama-7b-instruct.Q4_K_M.gguf",
                context_length=2048,
                gpu_layers=36,
                n_batch=64,
                temperature=0.1,
                max_tokens=1800
            ),
            ModelType.MISTRAL_7B: ModelConfig(
                name="Mistral 7B",
                model_path="models/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
                context_length=1024,
                gpu_layers=28,
                n_batch=128,
                temperature=0.2,
                max_tokens=1200
            ),
            ModelType.FALCON_7B: ModelConfig(
                name="Falcon 7B Premium",
                model_path="models/falcon-7b-instruct.Q4_K_M.gguf",
                context_length=4096,      # full 4k context
                gpu_layers=32,
                n_batch=128,
                temperature=0.2,
                max_tokens=2000
            )
        }

    def get_model_config(self, model_type: str) -> Optional[ModelConfig]:
        try:
            model_enum = ModelType(model_type)
            return self.model_configs.get(model_enum)
        except ValueError:
            return None

    def get_loaded_model(self, model_type: str):
        try:
            model_enum = ModelType(model_type)
            if model_enum in self._loaded_models:
                logger.info(f"Using cached model: {model_enum.value}")
                return self._loaded_models[model_enum]

            model_config = self.model_configs.get(model_enum)
            if not model_config:
                logger.error(f"No configuration found for model: {model_type}")
                return None

            logger.info(f"Loading model on demand: {model_config.name}")
            loaded_model = self._load_model(model_config)

            if loaded_model:
                self._loaded_models[model_enum] = loaded_model
                logger.info(f"Successfully loaded and cached model: {model_enum.value}")

            return loaded_model
        except ValueError:
            logger.error(f"Invalid model type: {model_type}")
            return None

    def _load_model(self, model_config: ModelConfig):
        try:
            from llama_cpp import Llama

            # GPU is required
            if not self.check_gpu_availability():
                logger.error("GPU not available. Cannot run models without NVIDIA GPU.")
                return None

            model_path = os.path.join(os.path.dirname(__file__), '..', model_config.model_path)
            if not os.path.exists(model_path):
                logger.error(f"Model file not found at {model_path}")
                return None

            logger.info(f"Loading {model_config.name} on RTX 3050")

            model = Llama(
                model_path=model_path,
                n_ctx=model_config.context_length,
                n_gpu_layers=model_config.gpu_layers,
                n_batch=model_config.n_batch,
                gpu_id=1,              # Hardcoded GPU index
                verbose=True,
                use_mlock=True,
                use_mmap=True,
                n_threads=1,
                f16_kv=True,
                offload_kv=False,
                flash_attn=True
            )

            logger.info(f"{model_config.name} loaded successfully on RTX 3050")
            return model

        except ImportError:
            logger.error("llama-cpp-python not installed.")
            return None
        except Exception as e:
            logger.error(f"Failed to load model {model_config.name}: {e}")
            return None

    def list_available_models(self) -> Dict[str, Dict[str, Any]]:
        models_info = {}
        for model_type, config in self.model_configs.items():
            models_info[model_type.value] = {
                'name': config.name,
                'context_length': config.context_length,
                'max_tokens': config.max_tokens,
                'loaded': model_type in self._loaded_models
            }
        return models_info

    def unload_model(self, model_type: str) -> bool:
        try:
            model_enum = ModelType(model_type)
            if model_enum in self._loaded_models:
                del self._loaded_models[model_enum]
                logger.info(f"Unloaded model: {model_type}")
                return True
            return False
        except ValueError:
            return False

    def unload_all_models(self):
        count = len(self._loaded_models)
        self._loaded_models.clear()
        logger.info(f"Unloaded {count} models from memory")

    def check_gpu_availability(self) -> bool:
        """Check if a CUDA GPU is available using CuPy."""
        try:
            import cupy as cp
            name = cp.cuda.runtime.getDeviceProperties(0)["name"].decode()
            logger.info(f"SUCCESS: Found NVIDIA GPU via CuPy: {name}")
            return True
        except ImportError:
            logger.error("CuPy not installed. It is required for GPU operations.")
        except Exception as e:
            logger.error(f"CuPy GPU check failed: {e}")
        
        logger.error("No NVIDIA GPU detected - strict GPU mode requires one.")
        return False
# Global instance
model_manager = ModelManager()
