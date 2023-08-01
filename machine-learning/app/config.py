import os
from pathlib import Path

from pydantic import BaseSettings

from .schemas import ModelType


class Settings(BaseSettings):
    cache_folder: str = "/cache"
    eager_startup: bool = False
    model_ttl: int = 0
    host: str = "0.0.0.0"
    port: int = 3003
    workers: int = 1
    test_full: bool = False
    request_threads: int = os.cpu_count() or 4
    model_inter_op_threads: int = 1
    model_intra_op_threads: int = 2

    class Config:
        env_prefix = "MACHINE_LEARNING_"
        case_sensitive = False


_clean_name = str.maketrans(":\\/", "___", ".")


def get_cache_dir(model_name: str, model_type: ModelType) -> Path:
    return Path(settings.cache_folder) / model_type.value / model_name.translate(_clean_name)


settings = Settings()
