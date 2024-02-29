from typing import Any

from aiocache.backends.memory import SimpleMemoryCache
from aiocache.lock import OptimisticLock
from aiocache.plugins import BasePlugin, TimingPlugin

from app.models import from_model_type

from ..schemas import ModelType, has_profiling
from .base import InferenceModel


class ModelCache:
    """Fetches a model from an in-memory cache, instantiating it if it's missing."""

    def __init__(
        self,
        preloaded_model_list: str = "",
        ttl: float | None = None,
        revalidate: bool = False,
        timeout: int | None = None,
        profiling: bool = False,
    ) -> None:
        """
        Args:
            preloaded_model_list: Comma-separated list of "type:model" pairs to preload. Defaults to "".
            ttl: Unloads model after this duration. Disabled if None. Defaults to None.
            revalidate: Resets TTL on cache hit. Useful to keep models in memory while active. Defaults to False.
            timeout: Maximum allowed time for model to load. Disabled if None. Defaults to None.
            profiling: Collects metrics for cache operations, adding slight overhead. Defaults to False.
        """

        self.ttl = ttl
        plugins = []

        if revalidate:
            plugins.append(RevalidationPlugin())
        if profiling:
            plugins.append(TimingPlugin())

        self.cache = SimpleMemoryCache(ttl=ttl, timeout=timeout, plugins=plugins, namespace=None)

        self.preload_models(preloaded_model_list)

    async def get(self, model_name: str, model_type: ModelType, **model_kwargs: Any) -> InferenceModel:
        """
        Args:
            model_name: Name of model in the model hub used for the task.
            model_type: Model type or task, which determines which model zoo is used.

        Returns:
            model: The requested model.
        """

        key = self.generate_key(model_name, model_type, **model_kwargs)

        if key in self.preloaded_models:
            return self.preloaded_models[key]

        async with OptimisticLock(self.cache, key) as lock:
            model: InferenceModel | None = await self.cache.get(key)
            if model is None:
                model = from_model_type(model_type, model_name, **model_kwargs)
                await lock.cas(model, ttl=self.ttl)
        return model

    async def get_profiling(self) -> dict[str, float] | None:
        if not has_profiling(self.cache):
            return None

        return self.cache.profiling

    def generate_key(self, model_name: str, model_type: ModelType, **model_kwargs: Any) -> str:
        return f"{model_name}{model_type.value}{model_kwargs.get('mode', '')}"

    def preload_models(self, preloaded_model_list: str) -> None:
        """Preloads models from comma-separated list of "type:model" pairs and stores them in memory."""
        if not self.preloaded_models:
            self.preloaded_models = {}

        preloaded_models = preloaded_model_list.split(",")
        self.preloaded_models: dict[str, InferenceModel] = {}
        for model_str in preloaded_models:
            if not model_str:
                continue
            if ":" not in model_str:
                continue
            model_type = ModelType(model_str.split(":")[0])
            model_name = model_str.split(":")[1]
            key = self.generate_key(model_name, model_type)
            self.preloaded_models[key] = from_model_type(model_type, model_name)


class RevalidationPlugin(BasePlugin):  # type: ignore[misc]
    """Revalidates cache item's TTL after cache hit."""

    async def post_get(
        self,
        client: SimpleMemoryCache,
        key: str,
        ret: Any | None = None,
        namespace: str | None = None,
        **kwargs: Any,
    ) -> None:
        if ret is None:
            return
        if namespace is not None:
            key = client.build_key(key, namespace)
        if key in client._handlers:
            await client.expire(key, client.ttl)
