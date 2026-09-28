import asyncio
from collections.abc import Hashable
from typing import Any

from immich_ml import allocator
from immich_ml.models.base import InferenceEntry, InferenceModel
from immich_ml.schemas import Options

Key = tuple[type[InferenceModel[Any]], str, Hashable]


class ModelCache:
    def __init__(self) -> None:
        self._models: dict[Key, InferenceModel[Any]] = {}
        self._expiries: dict[Key, asyncio.TimerHandle] = {}

    def get[O: Options](self, entry: InferenceEntry[O], ttl: int | None = None) -> InferenceModel[O]:
        key = (entry.model, entry.name, entry.model.graph(entry.options))
        if key not in self._models:
            self._models[key] = entry.model.create(entry.name, entry.options)
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

    def _evict(self, key: Key) -> None:
        if key not in self._models:
            return
        del self._models[key], self._expiries[key]
        allocator.release()
