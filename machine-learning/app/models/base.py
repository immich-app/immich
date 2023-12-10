from __future__ import annotations

import pickle
from abc import ABC, abstractmethod
from pathlib import Path
from shutil import rmtree
from typing import Any

import onnxruntime as ort
from huggingface_hub import snapshot_download
from typing_extensions import Buffer

import ann.ann

from app.models.constants import SUPPORTED_PROVIDERS

from ..config import get_cache_dir, get_hf_model_name, log, settings
from ..schemas import ModelType
from .ann import AnnSession


class InferenceModel(ABC):
    _model_type: ModelType

    def __init__(
        self,
        model_name: str,
        cache_dir: Path | str | None = None,
        providers: list[str] | None = None,
        provider_options: list[dict[str, Any]] | None = None,
        sess_options: ort.SessionOptions | None = None,
    ) -> None:
        self.loaded = False
        self.model_name = model_name
        self.cache_dir = Path(cache_dir) if cache_dir is not None else self.cache_dir_default
        self.providers = providers if providers is not None else self.providers_default
        self.provider_options = provider_options if provider_options is not None else self.provider_options_default
        self.sess_options = sess_options if sess_options is not None else self.sess_options_default

    def download(self) -> None:
        if not self.cached:
            log.info(
                f"Downloading {self.model_type.replace('-', ' ')} model '{self.model_name}'. This may take a while."
            )
            self._download()

    def load(self) -> None:
        if self.loaded:
            return
        self.download()
        log.info(f"Loading {self.model_type.replace('-', ' ')} model '{self.model_name}' to memory")
        self._load()
        self.loaded = True

    def predict(self, inputs: Any, **model_kwargs: Any) -> Any:
        self.load()
        if model_kwargs:
            self.configure(**model_kwargs)
        return self._predict(inputs)

    @abstractmethod
    def _predict(self, inputs: Any) -> Any:
        ...

    def configure(self, **model_kwargs: Any) -> None:
        pass

    def _download(self) -> None:
        snapshot_download(
            get_hf_model_name(self.model_name),
            cache_dir=self.cache_dir,
            local_dir=self.cache_dir,
            local_dir_use_symlinks=False,
        )

    @abstractmethod
    def _load(self) -> None:
        ...

    def clear_cache(self) -> None:
        if not self.cache_dir.exists():
            log.warn(
                f"Attempted to clear cache for model '{self.model_name}', but cache directory does not exist",
            )
            return
        if not rmtree.avoids_symlink_attacks:
            raise RuntimeError("Attempted to clear cache, but rmtree is not safe on this platform")

        if self.cache_dir.is_dir():
            log.info(f"Cleared cache directory for model '{self.model_name}'.")
            rmtree(self.cache_dir)
        else:
            log.warn(
                (
                    f"Encountered file instead of directory at cache path "
                    f"for '{self.model_name}'. Removing file and replacing with a directory."
                ),
            )
            self.cache_dir.unlink()
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _make_session(self, model_path: Path) -> AnnSession | ort.InferenceSession:
        armnn_path = model_path.with_suffix(".armnn")
        if settings.ann and ann.ann.is_available and armnn_path.is_file():
            session = AnnSession(armnn_path)
        elif model_path.is_file():
            session = ort.InferenceSession(
                model_path.as_posix(),
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            )
        else:
            raise ValueError(f"the file model_path='{model_path}' does not exist")
        return session

    @property
    def model_type(self) -> ModelType:
        return self._model_type

    @property
    def cache_dir(self) -> Path:
        return self._cache_dir

    @cache_dir.setter
    def cache_dir(self, cache_dir: Path) -> None:
        self._cache_dir = cache_dir

    @property
    def cache_dir_default(self) -> Path:
        return get_cache_dir(self.model_name, self.model_type)

    @property
    def cached(self) -> bool:
        return self.cache_dir.exists() and any(self.cache_dir.iterdir())

    @property
    def providers(self) -> list[str]:
        return self._providers

    @providers.setter
    def providers(self, providers: list[str]) -> None:
        log.debug(
            (
                f"Setting '{self.model_name}' execution providers to {self.providers}, "
                "in descending order of preference"
            ),
        )
        self._providers = providers

    @property
    def providers_default(self) -> list[str]:
        return list(SUPPORTED_PROVIDERS & set(ort.get_available_providers()))

    @property
    def provider_options(self) -> list[dict[str, Any]]:
        return self._provider_options

    @provider_options.setter
    def provider_options(self, provider_options: list[dict[str, Any]]) -> None:
        log.debug(f"Setting execution provider options to {self.provider_options}")
        self._provider_options = provider_options

    @property
    def provider_options_default(self) -> list[dict[str, Any]]:
        return [{"arena_extend_strategy": "kSameAsRequested"}] * len(self.providers)

    @property
    def sess_options(self) -> ort.SessionOptions:
        return self._sess_options

    @sess_options.setter
    def sess_options(self, sess_options: ort.SessionOptions) -> None:
        log.debug(f"Setting execution_mode to {sess_options.execution_mode.name}")
        log.debug(f"Setting inter_op_num_threads to {sess_options.inter_op_num_threads}")
        log.debug(f"Setting intra_op_num_threads to {sess_options.intra_op_num_threads}")
        self._sess_options = sess_options

    @property
    def sess_options_default(self) -> ort.SessionOptions:
        sess_options = PicklableSessionOptions()

        # avoid thread contention between models
        sess_options.inter_op_num_threads = settings.model_inter_op_threads
        sess_options.intra_op_num_threads = settings.model_intra_op_threads
        sess_options.enable_cpu_mem_arena = False
        if sess_options.inter_op_num_threads > 1:
            sess_options.execution_mode = ort.ExecutionMode.ORT_PARALLEL

        return sess_options


# HF deep copies configs, so we need to make session options picklable
class PicklableSessionOptions(ort.SessionOptions):  # type: ignore[misc]
    def __getstate__(self) -> bytes:
        return pickle.dumps([(attr, getattr(self, attr)) for attr in dir(self) if not callable(getattr(self, attr))])

    def __setstate__(self, state: Buffer) -> None:
        self.__init__()  # type: ignore[misc]
        attrs: list[tuple[str, Any]] = pickle.loads(state)
        for attr, val in attrs:
            setattr(self, attr, val)
