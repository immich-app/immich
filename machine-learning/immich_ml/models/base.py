from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from shutil import rmtree
from threading import Lock
from typing import Any, ClassVar

from huggingface_hub import snapshot_download

import immich_ml.sessions.ann.loader
import immich_ml.sessions.rknn as rknn
from immich_ml.sessions.ort import OrtSession

from ..config import clean_name, log, settings
from ..schemas import ModelFormat, ModelIdentity, ModelSession, ModelTask, ModelType
from ..sessions.ann import AnnSession
from ..sessions.policy import ShapePolicy

_IGNORED_PATTERNS: dict[ModelFormat, list[str]] = {
    ModelFormat.ONNX: ["*.armnn", "*.rknn"],
    ModelFormat.ARMNN: ["*.rknn"],
    ModelFormat.RKNN: ["*.armnn"],
}


class InferenceModel(ABC):
    depends: ClassVar[list[ModelIdentity]]
    identity: ClassVar[ModelIdentity]
    # options a graph is built for, so one instance cannot serve two values of them
    graph_options: ClassVar[tuple[str, ...]] = ()
    # the shapes this model feeds, which pick the artifact and tell the engine what it may pin
    shape_policy: ShapePolicy = ShapePolicy()

    def __init__(
        self,
        model_name: str,
        cache_dir: Path | str | None = None,
        model_format: ModelFormat | None = None,
        session: ModelSession | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.loaded = session is not None
        self.load_attempts = 0
        self._load_lock = Lock()
        self.model_name = clean_name(model_name)
        self.cache_dir = Path(cache_dir) if cache_dir is not None else self._cache_dir_default
        self.model_format = model_format if model_format is not None else self._model_format_default
        if session is not None:
            self.session = session

    def download(self) -> None:
        if self.cached:
            return
        model_type = self.model_type.replace("-", " ")
        log.info(f"Downloading {model_type} model '{self.model_name}' to {self.model_dir}. This may take a while.")
        snapshot_download(
            f"{settings.model_organization}/{self.model_name}",
            revision=settings.model_revision,
            cache_dir=self.cache_dir,
            local_dir=self.cache_dir,
            ignore_patterns=_IGNORED_PATTERNS.get(self.model_format, []),
        )
        if not self.cached:  # the repository has nothing in this format, which is what sends a model back to ONNX
            raise FileNotFoundError(f"Model file not found: {self.model_path}")

    def load(self) -> None:
        with self._load_lock:  # two requests may arrive for a model neither has loaded
            if self.loaded:
                return
            self.load_attempts += 1

            self.download()
            attempt = f"Attempt #{self.load_attempts} to load" if self.load_attempts > 1 else "Loading"
            log.info(f"{attempt} {self.model_type.replace('-', ' ')} model '{self.model_name}' to memory")
            self.session = self._load()
            self.loaded = True

    def unload(self) -> None:
        with self._load_lock:
            if self.loaded:
                del self.session
                self.loaded = False

    def build(self) -> None:
        self.load()
        self.session.warm()

    def predict(self, *inputs: Any, **model_kwargs: Any) -> Any:
        self.load()
        return self._predict(*inputs, **model_kwargs)

    @abstractmethod
    def _predict(self, *inputs: Any, **model_kwargs: Any) -> Any: ...

    def _load(self) -> ModelSession:
        return self._make_session()

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

    def _make_session(self) -> ModelSession:
        match self.model_format:
            case ModelFormat.ARMNN:
                return AnnSession(self.model_path)
            case ModelFormat.ONNX:
                return OrtSession(self.model_path, self.shape_policy, self.model_task)
            case ModelFormat.RKNN:
                return rknn.RknnSession(self.model_path)

    @property
    def model_dir(self) -> Path:
        return self.cache_dir / self.model_type.value

    @property
    def model_path(self) -> Path:
        if self.model_format == ModelFormat.RKNN:
            return rknn.model_path(self.model_dir, self.shape_policy.label)
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
        cache_dir = settings.cache_folder / self.model_task.value / self.model_name
        return cache_dir if settings.legacy_models else cache_dir / settings.model_revision

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
