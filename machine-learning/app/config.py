import concurrent.futures
import logging
import os
import sys
from pathlib import Path
from socket import socket

from gunicorn.arbiter import Arbiter
from pydantic import BaseModel, BaseSettings
from rich.console import Console
from rich.logging import RichHandler
from uvicorn import Server
from uvicorn.workers import UvicornWorker

from .schemas import ModelType


class PreloadModelData(BaseModel):
    clip: str | None
    facial_recognition: str | None


class Settings(BaseSettings):
    cache_folder: str = "/cache"
    model_ttl: int = 300
    model_ttl_poll_s: int = 10
    host: str = "0.0.0.0"
    port: int = 3003
    workers: int = 1
    test_full: bool = False
    request_threads: int = os.cpu_count() or 4
    model_inter_op_threads: int = 0
    model_intra_op_threads: int = 0
    ann: bool = True
    preload: PreloadModelData | None = None

    class Config:
        env_prefix = "MACHINE_LEARNING_"
        case_sensitive = False
        env_nested_delimiter = "__"


class LogSettings(BaseSettings):
    immich_log_level: str = "info"
    no_color: bool = False

    class Config:
        case_sensitive = False


_clean_name = str.maketrans(":\\/", "___", ".")


def clean_name(model_name: str) -> str:
    return model_name.split("/")[-1].translate(_clean_name)


def get_cache_dir(model_name: str, model_type: ModelType) -> Path:
    return Path(settings.cache_folder) / model_type.value / clean_name(model_name)


def get_hf_model_name(model_name: str) -> str:
    return f"immich-app/{clean_name(model_name)}"


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

LOG_LEVEL = LOG_LEVELS.get(log_settings.immich_log_level.lower(), logging.INFO)


class CustomRichHandler(RichHandler):
    def __init__(self) -> None:
        console = Console(color_system="standard", no_color=log_settings.no_color)
        self.excluded = ["uvicorn", "starlette", "fastapi"]
        super().__init__(
            show_path=False,
            omit_repeated_times=False,
            console=console,
            rich_tracebacks=True,
            tracebacks_suppress=[*self.excluded, concurrent.futures],
            tracebacks_show_locals=LOG_LEVEL == logging.DEBUG,
        )

    # hack to exclude certain modules from rich tracebacks
    def emit(self, record: logging.LogRecord) -> None:
        if record.exc_info is not None:
            tb = record.exc_info[2]
            while tb is not None:
                if any(excluded in tb.tb_frame.f_code.co_filename for excluded in self.excluded):
                    tb.tb_frame.f_locals["_rich_traceback_omit"] = True
                tb = tb.tb_next

        return super().emit(record)


log = logging.getLogger("ml.log")
log.setLevel(LOG_LEVEL)


# patches this issue https://github.com/encode/uvicorn/discussions/1803
class CustomUvicornServer(Server):
    async def shutdown(self, sockets: list[socket] | None = None) -> None:
        for sock in sockets or []:
            sock.close()
        await super().shutdown()


class CustomUvicornWorker(UvicornWorker):
    async def _serve(self) -> None:
        self.config.app = self.wsgi
        server = CustomUvicornServer(config=self.config)
        self._install_sigquit_handler()
        await server.serve(sockets=self.sockets)
        if not server.started:
            sys.exit(Arbiter.WORKER_BOOT_ERROR)
