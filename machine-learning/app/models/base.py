from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from shutil import rmtree
from typing import Any, ClassVar

from huggingface_hub import snapshot_download

import ann.ann
from app.sessions.ort import OrtSession

from ..config import clean_name, log, settings
from ..schemas import ModelFormat, ModelIdentity, ModelSession, ModelTask, ModelType
from ..sessions.ann import AnnSession


class InferenceModel(ABC):
    depends: ClassVar[list[ModelIdentity]]
    identity: ClassVar[ModelIdentity]

    def __init__(
        self,
        model_name: str,
        cache_dir: Path | str | None = None,
        preferred_format: ModelFormat | None = None,
        session: ModelSession | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.loaded = session is not None
        self.load_attempts = 0
        self.model_name = clean_name(model_name)
        self.cache_dir = Path(cache_dir) if cache_dir is not None else self._cache_dir_default
        self.model_format = preferred_format if preferred_format is not None else self._model_format_default
        if session is not None:
            self.session = session

    def download(self) -> None:
        if not self.cached:
            log.info(
                f"Downloading {self.model_type.replace('-', ' ')} model '{self.model_name}'. This may take a while."
            )
            self._download()

    def load(self) -> None:
        if self.loaded:
            return
        self.load_attempts += 1

        self.download()
        attempt = f"Attempt #{self.load_attempts + 1} to load" if self.load_attempts else "Loading"
        log.info(f"{attempt} {self.model_type.replace('-', ' ')} model '{self.model_name}' to memory")
        self.session = self._load()
        self.loaded = True

    def predict(self, *inputs: Any, **model_kwargs: Any) -> Any:
        self.load()
        if model_kwargs:
            self.configure(**model_kwargs)
        return self._predict(*inputs, **model_kwargs)

    @abstractmethod
    def _predict(self, *inputs: Any, **model_kwargs: Any) -> Any: ...

    def configure(self, **kwargs: Any) -> None:
        pass

    def _download(self) -> None:
        ignore_patterns = [] if self.model_format == ModelFormat.ARMNN else ["*.armnn"]
        snapshot_download(
            f"immich-app/{clean_name(self.model_name)}",
            cache_dir=self.cache_dir,
            local_dir=self.cache_dir,
            local_dir_use_symlinks=False,
            ignore_patterns=ignore_patterns,
        )

    def _load(self) -> ModelSession:
        return self._make_session(self.model_path)

    def clear_cache(self) -> None:
        if not self.cache_dir.exists():
            log.warning(
                f"Attempted to clear cache for model '{self.model_name}', but cache directory does not exist",
            )
            return
        if not rmtree.avoids_symlink_attacks:
            raise RuntimeError("Attempted to clear cache, but rmtree is not safe on this platform")

        if self.cache_dir.is_dir():
            log.info(f"Cleared cache directory for model '{self.model_name}'.")
            rmtree(self.cache_dir)
        else:
            log.warning(
                (
                    f"Encountered file instead of directory at cache path "
                    f"for '{self.model_name}'. Removing file and replacing with a directory."
                ),
            )
            self.cache_dir.unlink()
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _make_session(self, model_path: Path) -> ModelSession:
        match model_path.suffix:
            case ".armnn":
                session: ModelSession = AnnSession(model_path)
            case ".onnx":
                session = OrtSession(model_path)
            case _:
                raise ValueError(f"Unsupported model file type: {model_path.suffix}")
        return session

    @property
    def model_dir(self) -> Path:
        return self.cache_dir / self.model_type.value

    @property
    def model_path(self) -> Path:
        return self.model_dir / f"model.{self.model_format}"

    @property
    def model_task(self) -> ModelTask:
        return self.identity[1]

    @property
    def model_type(self) -> ModelType:
        return self.identity[0]

    @property
    def cache_dir(self) -> Path:
        return self._cache_dir

    @cache_dir.setter
    def cache_dir(self, cache_dir: Path) -> None:
        self._cache_dir = cache_dir

    @property
    def _cache_dir_default(self) -> Path:
        return settings.cache_folder / self.model_task.value / self.model_name

    @property
    def cached(self) -> bool:
        return self.model_path.is_file()

    @property
    def model_format(self) -> ModelFormat:
        return self._preferred_format

    @model_format.setter
    def model_format(self, preferred_format: ModelFormat) -> None:
        log.debug(f"Setting preferred format to {preferred_format}")
        self._preferred_format = preferred_format

    @property
    def _model_format_default(self) -> ModelFormat:
        prefer_ann = ann.ann.is_available and settings.ann
        ann_exists = (self.model_dir / "model.armnn").is_file()
        if prefer_ann and not ann_exists:
            log.warning(f"ARM NN is available, but '{self.model_name}' does not support ARM NN. Falling back to ONNX.")
        return ModelFormat.ARMNN if prefer_ann and ann_exists else ModelFormat.ONNX
