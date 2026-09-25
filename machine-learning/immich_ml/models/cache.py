import asyncio
from typing import Any

from immich_ml import allocator
from immich_ml.models import get_model_class
from immich_ml.models.base import InferenceModel

from ..schemas import ModelTask, ModelType


class ModelCache:
    def __init__(self) -> None:
        self._models: dict[tuple[Any, ...], InferenceModel] = {}
        self._expiries: dict[tuple[Any, ...], asyncio.TimerHandle] = {}

    def get(
        self, model_name: str, model_type: ModelType, model_task: ModelTask, ttl: int | None = None, **options: Any
    ) -> InferenceModel:
        model_cls = get_model_class(model_name, model_type, model_task)
        key = (model_name, model_type, model_task)
        if key not in self._models:
            self._models[key] = model_cls(model_name, **options)
        elif key not in self._expiries:
            ttl = None  # a model that was preloaded stays
        if ttl:
            if key in self._expiries:
                self._expiries[key].cancel()
            self._expiries[key] = asyncio.get_running_loop().call_later(ttl, self._evict, key)
        return self._models[key]

    def clear(self) -> None:
        if not self._models:
            return
        self._models.clear()
        for key in list(self._expiries.keys()):
            self._expiries.pop(key).cancel()
        allocator.release()

    def _evict(self, key: tuple[Any, ...]) -> None:
        if key not in self._models:
            return
        del self._models[key], self._expiries[key]
        allocator.release()
