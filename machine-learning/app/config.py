import os
from pathlib import Path
from typing import Any

from pydantic import BaseSettings

from .schemas import ModelType


class Settings(BaseSettings):
    cache_folder: str = "/cache"
    classification_model: str = "microsoft/resnet-50"
    clip_image_model: str = "clip-ViT-B-32"
    clip_text_model: str = "clip-ViT-B-32"
    facial_recognition_model: str = "buffalo_l"
    min_tag_score: float = 0.9
    eager_startup: bool = True
    max_batch_size: int = 16
    batch_timeout_s: float = 0.01
    max_concurrency: int = 256
    model_ttl: int = 300
    num_cpus: int = os.cpu_count() or 1
    host: str = "0.0.0.0"
    port: int = 3003
    workers: int = 1
    min_face_score: float = 0.7
    test_full: bool = False

    class Config(BaseSettings.Config):
        env_prefix = "MACHINE_LEARNING_"
        case_sensitive = False

    @property
    def autoscaling(self) -> dict[str, Any]:
        return {
            "min_replicas": 0,
            "initial_replicas": int(self.eager_startup),
            "max_replicas": 1,
            "metrics_interval_s": 1,
            "downscale_delay_s": self.model_ttl,
            "upscale_delay_s": 30,
        }


def get_cache_dir(model_name: str, model_type: ModelType) -> Path:
    return Path(settings.cache_folder, model_type.value, model_name)


settings = Settings()
