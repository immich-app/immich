from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from shutil import rmtree
from typing import Any

from onnxruntime.capi.onnxruntime_pybind11_state import InvalidProtobuf

from ..config import get_cache_dir
from ..schemas import ModelType


class InferenceModel(ABC):
    _model_type: ModelType

    def __init__(
        self, model_name: str, cache_dir: Path | None = None, **model_kwargs
    ) -> None:
        self.model_name = model_name
        self._cache_dir = (
            cache_dir
            if cache_dir is not None
            else get_cache_dir(model_name, self.model_type)
        )

        try:
            self.load(**model_kwargs)
        except (OSError, InvalidProtobuf):
            self.clear_cache()
            self.load(**model_kwargs)

    @abstractmethod
    def load(self, **model_kwargs: Any) -> None:
        ...

    @abstractmethod
    def predict(self, inputs: Any) -> Any:
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
    def from_model_type(
        cls, model_type: ModelType, model_name, **model_kwargs
    ) -> InferenceModel:
        subclasses = {
            subclass._model_type: subclass for subclass in cls.__subclasses__()
        }
        if model_type not in subclasses:
            raise ValueError(f"Unsupported model type: {model_type}")

        return subclasses[model_type](model_name, **model_kwargs)

    def clear_cache(self) -> None:
        if not self.cache_dir.exists():
            return
        elif not rmtree.avoids_symlink_attacks:
            raise RuntimeError(
                "Attempted to clear cache, but rmtree is not safe on this platform."
            )

        rmtree(self.cache_dir)
