from pathlib import Path

from pydantic import BaseSettings

from .schemas import ModelType


class Settings(BaseSettings):
    cache_folder: str = "/cache"
    classification_model: str = "microsoft/resnet-50"
    clip_image_model: str = "clip-ViT-B-32"
    clip_text_model: str = "clip-ViT-B-32"
    facial_recognition_model: str = "buffalo_l"
    min_tag_score: float = 0.9
    eager_startup: bool = False
    model_ttl: int = 0
    host: str = "0.0.0.0"
    port: int = 3003
    workers: int = 1
    min_face_score: float = 0.7
    test_full: bool = False

    class Config:
        env_prefix = "MACHINE_LEARNING_"
        case_sensitive = False


def get_cache_dir(model_name: str, model_type: ModelType) -> Path:
    return Path(settings.cache_folder, model_type.value, model_name)


settings = Settings()
