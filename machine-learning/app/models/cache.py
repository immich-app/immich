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
        ttl: float | None = None,
        revalidate: bool = False,
        timeout: int | None = None,
        profiling: bool = False,
    ) -> None:
        """
        Args:
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

    async def get(self, model_name: str, model_type: ModelType, **model_kwargs: Any) -> InferenceModel:
        """
        Args:
            model_name: Name of model in the model hub used for the task.
            model_type: Model type or task, which determines which model zoo is used.

        Returns:
            model: The requested model.
        """

        key = f"{model_name}{model_type.value}{model_kwargs.get('mode', '')}"
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
