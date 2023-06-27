from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from ..config import get_cache_dir
from ..schemas import ModelType


class InferenceModel(ABC):
    _model_type: ModelType

    def __init__(
        self,
        model_name: str,
        cache_dir: Path | None = None,
    ):
        self.model_name = model_name
        self._cache_dir = (
            cache_dir
            if cache_dir is not None
            else get_cache_dir(model_name, self.model_type)
        )

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
    def cache_dir(self, cache_dir: Path):
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
