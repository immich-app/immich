import logging
import os
from pathlib import Path

import starlette
from pydantic import BaseSettings
from rich.console import Console
from rich.logging import RichHandler

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


class LogSettings(BaseSettings):
    log_level: str = "info"
    no_color: bool = False

    class Config:
        case_sensitive = False


_clean_name = str.maketrans(":\\/", "___", ".")


def get_cache_dir(model_name: str, model_type: ModelType) -> Path:
    return Path(settings.cache_folder) / model_type.value / model_name.translate(_clean_name)


LOG_LEVELS: dict[str, int] = {
    "critical": logging.ERROR,
    "error": logging.ERROR,
    "warning": logging.WARNING,
    "warn": logging.WARNING,
    "info": logging.INFO,
    "log": logging.INFO,
    "debug": logging.DEBUG,
    "verbose": logging.DEBUG,
}

settings = Settings()
log_settings = LogSettings()

console = Console(color_system="standard", no_color=log_settings.no_color)
logging.basicConfig(
    format="%(message)s",
    handlers=[
        RichHandler(show_path=False, omit_repeated_times=False, console=console, tracebacks_suppress=[starlette])
    ],
)
log = logging.getLogger("uvicorn")
log.setLevel(LOG_LEVELS.get(log_settings.log_level.lower(), logging.INFO))
