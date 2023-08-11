from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from shutil import rmtree
from typing import Any
from zipfile import BadZipFile

from onnxruntime.capi.onnxruntime_pybind11_state import InvalidProtobuf  # type: ignore

from ..config import get_cache_dir
from ..schemas import ModelType


class InferenceModel(ABC):
    _model_type: ModelType

    def __init__(
        self, model_name: str, cache_dir: Path | str | None = None, eager: bool = True, **model_kwargs: Any
    ) -> None:
        self.model_name = model_name
        self._loaded = False
        self._cache_dir = Path(cache_dir) if cache_dir is not None else get_cache_dir(model_name, self.model_type)
        loader = self.load if eager else self.download
        try:
            loader(**model_kwargs)
        except (OSError, InvalidProtobuf, BadZipFile):
            self.clear_cache()
            loader(**model_kwargs)

    def download(self, **model_kwargs: Any) -> None:
        if not self.cached:
            self._download(**model_kwargs)

    def load(self, **model_kwargs: Any) -> None:
        self.download(**model_kwargs)
        self._load(**model_kwargs)
        self._loaded = True

    def predict(self, inputs: Any) -> Any:
        if not self._loaded:
            self.load()
        return self._predict(inputs)

    @abstractmethod
    def _predict(self, inputs: Any) -> Any:
        ...

    @abstractmethod
    def _download(self, **model_kwargs: Any) -> None:
        ...

    @abstractmethod
    def _load(self, **model_kwargs: Any) -> None:
        ...

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
    def cached(self) -> bool:
        return self.cache_dir.exists() and any(self.cache_dir.iterdir())

    @classmethod
    def from_model_type(cls, model_type: ModelType, model_name: str, **model_kwargs: Any) -> InferenceModel:
        subclasses = {subclass._model_type: subclass for subclass in cls.__subclasses__()}
        if model_type not in subclasses:
            raise ValueError(f"Unsupported model type: {model_type}")

        return subclasses[model_type](model_name, **model_kwargs)

    def clear_cache(self) -> None:
        if not self.cache_dir.exists():
            return
        if not rmtree.avoids_symlink_attacks:
            raise RuntimeError("Attempted to clear cache, but rmtree is not safe on this platform.")

        if self.cache_dir.is_dir():
            rmtree(self.cache_dir)
        else:
            self.cache_dir.unlink()
        self.cache_dir.mkdir(parents=True, exist_ok=True)
