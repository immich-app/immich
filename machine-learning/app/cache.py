from aiocache.plugins import TimingPlugin, BasePlugin
from aiocache.backends.memory import SimpleMemoryCache
from typing import Any
from models import get_model


class ModelCache:
    """Fetches a model from an in-memory cache, instantiating it if it's missing."""

    def __init__(
        self,
        ttl: int | None = None,
        revalidate: bool = False,
        timeout: int | None = None,
        profiling: bool = False,
    ):
        """
        Args:
            ttl: Unloads model after this duration. Disabled if None. Defaults to None.
            revalidate: Resets TTL on cache hit. Useful to keep models in memory while active. Defaults to False.
            timeout: Maximum allowed time for model to load. Disabled if None. Defaults to None.
            profiling: Collects metrics for cache operations, adding slight overhead. Defaults to False.
        """

        plugins = []

        if revalidate:
            plugins.append(RevalidationPlugin())
        if profiling:
            plugins.append(TimingPlugin())

        self.cache = SimpleMemoryCache(ttl=ttl, timeout=timeout, plugins=plugins)

    async def get_cached_model(
        self, model_name: str, model_type: str, **model_kwargs
    ) -> Any:
        """
        Args:
            model_name: Name of model in the model hub used for the task.
            model_type: Model type or task, which determines which model zoo is used.

        Returns:
            model: The requested model.
        """

        model = await self.cache.get(model_name, namespace=model_type)
        if model is None:
            model = get_model(model_name, model_type, **model_kwargs)
            await self.cache.set(
                model_name,
                model,
                namespace=model_type,
            )
        return model

    async def get_profiling(self) -> dict[str, float] | None:
        if not hasattr(self.cache, "profiling"):
            return None

        return self.cache.profiling  # type: ignore


class RevalidationPlugin(BasePlugin):
    """Revalidates cache item's TTL after cache hit."""

    async def post_get(self, client, key, ret=None, namespace=None, **kwargs):
        if ret is None:
            return
        if namespace is not None:
            key = client.build_key(key, namespace)
        if key in client._handlers:
            await client.expire(key, client.ttl)

    async def post_multi_get(self, client, keys, ret=None, namespace=None, **kwargs):
        if ret is None:
            return

        for key, val in zip(keys, ret):
            if namespace is not None:
                key = client.build_key(key, namespace)
            if val is not None and key in client._handlers:
                await client.expire(key, client.ttl)
