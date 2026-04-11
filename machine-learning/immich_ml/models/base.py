from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from shutil import rmtree
from typing import Any, ClassVar

from huggingface_hub import snapshot_download

import immich_ml.sessions.ann.loader
import immich_ml.sessions.rknn as rknn
from immich_ml.sessions.ort import OrtSession

from ..config import clean_name, log, settings
from ..schemas import ModelFormat, ModelIdentity, ModelSession, ModelTask, ModelType
from ..sessions.ann import AnnSession


class InferenceModel(ABC):
    depends: ClassVar[list[ModelIdentity]]
    identity: ClassVar[ModelIdentity]
    use_type_subfolder: ClassVar[bool] = True
    model_file: ClassVar[str | None] = None

    def __init__(
        self,
        model_name: str,
        cache_dir: str | Path | None = None,
        model_format: ModelFormat | None = None,
        session: ModelSession | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.loaded = session is not None
        self.load_attempts = 0
        self.model_name = clean_name(model_name)
        self.cache_dir = Path(cache_dir) if cache_dir is not None else self._cache_dir_default
        self.model_format = model_format if model_format is not None else self._model_format_default
        self.hf_token = model_kwargs.get("hfToken") or settings.hf_token
        self.model_file = model_kwargs.get("modelFile") or getattr(self, "model_file", None)
        if session is not None:
            self.session = session

    def download(self) -> None:
        log.debug(f"Checking cache for {self.model_name} at {self.model_path}")
        if not self.cached:
            model_type = self.model_type.replace("-", " ")
            log.warning(f"Downloading {model_type} model '{self.model_name}' to {self.model_path}. This may take a while.")
            self._download()
        else:
            log.warning(f"Model '{self.model_name}' is already cached at {self.model_path}")

    def load(self) -> None:
        if self.loaded:
            return
        self.load_attempts += 1

        log.debug(f"Calling self.download() for {self.model_name}")
        self.download()
        attempt = f"Attempt #{self.load_attempts} to load" if self.load_attempts > 1 else "Loading"
        log.warning(f"{attempt} {self.model_type.replace('-', ' ')} model '{self.model_name}' to memory from {self.model_path}")
        log.debug(f"Attempting to _load from {self.model_path}")
        self.session = self._load()
        self.loaded = True

    def predict(self, *inputs: Any, **model_kwargs: Any) -> Any:
        self.load()
        if model_kwargs:
            self.configure(**model_kwargs)
        return self._predict(*inputs)

    @abstractmethod
    def _predict(self, *inputs: Any, **model_kwargs: Any) -> Any: ...

    def configure(self, **kwargs: Any) -> None:
        pass

    def _download(self) -> None:
        ignored_patterns: dict[ModelFormat, list[str]] = {
            ModelFormat.ONNX: ["*.armnn", "*.rknn"],
            ModelFormat.ARMNN: ["*.rknn"],
            ModelFormat.RKNN: ["*.armnn"],
        }

        repo_id = getattr(self, "hf_repo", f"immich-app/{clean_name(self.model_name)}")
        log.info(f"Initiating download for model '{self.model_name}' from repo '{repo_id}' to {self.cache_dir}")

        try:
            log.debug(f"Calling snapshot_download for '{repo_id}' (token provided: {bool(self.hf_token)})")
            snapshot_download(
                repo_id,
                cache_dir=self.cache_dir,
                local_dir=self.cache_dir,
                ignore_patterns=ignored_patterns.get(self.model_format, []),
                token=self.hf_token,
            )
            log.info(f"Successfully finished snapshot_download for '{repo_id}'")
        except Exception as e:
            log.error(f"CRITICAL: Failed to download model '{self.model_name}' from Hugging Face repo '{repo_id}': {e}")
            raise e

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
            rmtree(self.cache_dir, ignore_errors=True)
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
        if not model_path.is_file():
            raise FileNotFoundError(f"Model file not found: {model_path}")

        match model_path.suffix:
            case ".armnn":
                session: ModelSession = AnnSession(model_path)
            case ".onnx":
                session = OrtSession(model_path)
            case ".rknn":
                session = rknn.RknnSession(model_path)
            case _:
                raise ValueError(f"Unsupported model file type: {model_path.suffix}")
        return session

    def model_path_for_format(self, model_format: ModelFormat) -> Path:
        model_path_prefix = rknn.model_prefix if model_format == ModelFormat.RKNN else None
        filename = self.model_file or f"model.{model_format}"
        if model_path_prefix:
            return self.model_dir / model_path_prefix / filename
        return self.model_dir / filename

    @property
    def model_dir(self) -> Path:
        if self.use_type_subfolder:
            return self.cache_dir / self.model_type.value
        return self.cache_dir

    @property
    def model_path(self) -> Path:
        return self.model_path_for_format(self.model_format)

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
        return self._model_format

    @model_format.setter
    def model_format(self, model_format: ModelFormat) -> None:
        log.debug(f"Setting model format to {model_format}")
        self._model_format = model_format

    @property
    def _model_format_default(self) -> ModelFormat:
        if rknn.is_available:
            return ModelFormat.RKNN
        elif immich_ml.sessions.ann.loader.is_available and settings.ann:
            return ModelFormat.ARMNN
        else:
            return ModelFormat.ONNX
