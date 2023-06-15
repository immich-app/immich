from pydantic import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    classification_model: str = "microsoft/resnet-50"
    clip_image_model: str = "clip-ViT-B-32"
    clip_text_model: str = "clip-ViT-B-32"
    facial_recognition_model: str = "buffalo_l"
    min_tag_score: float = 0.9
    eager_startup: bool = True
    model_ttl: int = 300


    class Config(BaseSettings.Config):
        env_prefix = 'MACHINE_LEARNING_'
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
