import asyncio
import time
from typing import Any, Awaitable, Callable, TypeVar

from app.schemas import ModelType

from .base import get_model_key, log


F = TypeVar("F")
P = TypeVar("P")
R = TypeVar("R")


class Batcher:
    def __init__(self, max_size: int = 16, timeout_s: float = 0.005) -> None:
        self.max_size = max_size
        self.timeout_s = timeout_s
        self.queue: asyncio.Queue[Any] = asyncio.Queue(maxsize=max_size)
        self.lock = asyncio.Lock()
        self.processing: dict[int, Any] = {}
        self.processed: dict[int, Any] = {}
        self.element_id = 0

    async def batch_process(self, element: Any, func: Callable[[list[P]], Awaitable[list[R]]], *args: Any, **kwargs: Any) -> Any:
        cur_idx = self.element_id
        self.element_id += 1
        self.processing[cur_idx] = element
        await self.queue.put(cur_idx)
        try:
            async with self.lock:
                await self._batch(cur_idx)
                if cur_idx not in self.processed:
                    await self._process(func, *args, **kwargs)
            return self.processed.pop(cur_idx)
        finally:
            self.processing.pop(cur_idx, None)
            self.processed.pop(cur_idx, None)
    
    async def _batch(self, idx: int) -> list[Any]:
        if idx not in self.processed:
            start = time.monotonic()
            while self.queue.qsize() < self.max_size and time.monotonic() - start < self.timeout_s:
                await asyncio.sleep(0)

    async def _process(self, func: Callable[[list[P]], Awaitable[list[R]]], *args, **kwargs) -> None:
        batch_ids = [self.queue.get_nowait() for _ in range(self.queue.qsize())]
        batch = [self.processing.pop(id) for id in batch_ids]
        outputs = await func(*args, batch, **kwargs)
        for id, output in zip(batch_ids, outputs):
            self.processed[id] = output


class ModelBatcher:
    def __init__(self, max_size: int = 16, timeout_s: float = 0.005) -> None:
        self.batchers = {}
        self.max_size = max_size
        self.timeout_s = timeout_s

    def get(self, model_name: str, model_type: ModelType, **model_kwargs: Any):
        key = get_model_key(model_name, model_type, model_kwargs.get("mode", ""))
        if key not in self.batchers:
            self.batchers[key] = Batcher(max_size=self.max_size, timeout_s=self.timeout_s)
        
        return self.batchers[key]
