from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from shutil import rmtree
from typing import Any

from onnxruntime.capi.onnxruntime_pybind11_state import InvalidProtobuf  # type: ignore

from ..config import get_cache_dir, settings
from ..schemas import ModelType


class InferenceModel(ABC):
    __slots__ = ("model_name", "_cache_dir", "eager", "model_kwargs", "model")
    _model_type: ModelType

    def __init__(
        self,
        model_name: str,
        cache_dir: Path | str | None = None,
        eager: bool = settings.eager_startup,
        **model_kwargs: Any,
    ) -> None:
        self.model_name = model_name
        self._cache_dir = Path(cache_dir) if cache_dir is not None else get_cache_dir(model_name, self.model_type)
        self.eager = eager
        self.model_kwargs = model_kwargs
        self.model: Any = None
        if eager:
            self.load()

    def load(self, **kwargs: Any) -> None:
        self.model = None
        try:
            self.model = self._load(**self.model_kwargs, **kwargs)
        except (OSError, InvalidProtobuf):
            self.clear_cache()
            self.model = self._load(**self.model_kwargs, **kwargs)

    def predict(self, inputs: Any) -> Any:
        return self.predict_batch([inputs])[0]

    def predict_batch(self, inputs: list[Any]) -> list[Any]:
        if not self.model:
            self.load()
        return self._predict_batch(inputs)

    @abstractmethod
    def _load(self, **model_kwargs: Any) -> Any:
        ...

    @abstractmethod
    def _predict_batch(self, inputs: list[Any]) -> list[Any]:
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

    @classmethod
    def from_model_type(cls, model_type: ModelType, model_name: str, **model_kwargs: Any) -> InferenceModel:
        subclasses = {subclass._model_type: subclass for subclass in cls.__subclasses__()}
        if model_type not in subclasses:
            raise ValueError(f"Unsupported model type: {model_type}")

        return subclasses[model_type](model_name, **model_kwargs)

    def clear_cache(self) -> None:
        if not self.cache_dir.exists():
            return
        elif not rmtree.avoids_symlink_attacks:
            raise RuntimeError("Attempted to clear cache, but rmtree is not safe on this platform.")

        rmtree(self.cache_dir)
