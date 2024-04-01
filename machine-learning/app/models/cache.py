from typing import Any

from aiocache.backends.memory import SimpleMemoryCache
from aiocache.lock import OptimisticLock
from aiocache.plugins import TimingPlugin

from app.models import from_model_type
from app.models.facial_recognition.pipeline import FacialRecognitionPipeline

from ..schemas import ModelTask, ModelType, Predictor, has_profiling


class ModelCache:
    """Fetches a model from an in-memory cache, instantiating it if it's missing."""

    def __init__(
        self,
        revalidate: bool = False,
        timeout: int | None = None,
        profiling: bool = False,
    ) -> None:
        """
        Args:
            revalidate: Resets TTL on cache hit. Useful to keep models in memory while active. Defaults to False.
            timeout: Maximum allowed time for model to load. Disabled if None. Defaults to None.
            profiling: Collects metrics for cache operations, adding slight overhead. Defaults to False.
        """

        plugins = []

        if profiling:
            plugins.append(TimingPlugin())

        self.should_revalidate = revalidate

        self.cache = SimpleMemoryCache(timeout=timeout, plugins=plugins, namespace=None)

    async def get(
        self, model_name: str, model_type: ModelType, model_task: ModelTask, **model_kwargs: Any
    ) -> Predictor:
        """
        Args:
            model_name: Name of model in the model hub used for the task.
            model_type: Model type or task, which determines which model zoo is used.

        Returns:
            model: The requested model.
        """

        key = f"{model_name}{model_type.value}{model_task.value}"

        async with OptimisticLock(self.cache, key) as lock:
            model: Predictor | None = await self.cache.get(key)
            if model is None:
                if model_type == ModelType.PIPELINE:
                    model = await self._get_pipeline(model_name, model_task, **model_kwargs)
                else:
                    model = from_model_type(model_name, model_type, model_task, **model_kwargs)
                await lock.cas(model, ttl=model_kwargs.get("ttl", None))
            elif self.should_revalidate:
                await self.revalidate(key, model_kwargs.get("ttl", None))
        return model

    async def _get_pipeline(self, model_name: str, model_task: ModelTask, **model_kwargs: Any) -> Predictor:
        """
        Args:
            model_name: Name of model in the model hub used for the task.
            model_type: Model type or task, which determines which model zoo is used.

        Returns:
            model: The requested model.
        """
        match model_task:
            case ModelTask.FACIAL_RECOGNITION:
                det_model: Any = await self.get(model_name, ModelType.DETECTION, model_task, **model_kwargs)
                rec_model: Any = await self.get(model_name, ModelType.RECOGNITION, model_task, **model_kwargs)
                return FacialRecognitionPipeline(det_model, rec_model)

            case _:
                raise ValueError(f"Unknown model task: {model_task}")

    async def get_profiling(self) -> dict[str, float] | None:
        if not has_profiling(self.cache):
            return None

        return self.cache.profiling

    async def revalidate(self, key: str, ttl: int | None) -> None:
        if ttl is not None and key in self.cache._handlers:
            await self.cache.expire(key, ttl)
