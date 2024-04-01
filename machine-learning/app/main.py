import asyncio
import gc
import os
import signal
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from functools import partial
from typing import Any, AsyncGenerator, Callable, Iterator

import orjson
from fastapi import Depends, FastAPI, Form, HTTPException, UploadFile
from fastapi.responses import ORJSONResponse
from starlette.formparsers import MultiPartParser

from .config import PreloadModelData, log, settings
from .models.cache import ModelCache
from .schemas import (
    MessageResponse,
    ModelTask,
    ModelType,
    Predictor,
    TextResponse,
)

MultiPartParser.max_file_size = 2**26  # spools to disk if payload is 64 MiB or larger

model_cache = ModelCache(revalidate=settings.model_ttl > 0)
thread_pool: ThreadPoolExecutor | None = None
lock = threading.Lock()
active_requests = 0
last_called: float | None = None


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    global thread_pool
    log.info(
        (
            "Created in-memory cache with unloading "
            f"{f'after {settings.model_ttl}s of inactivity' if settings.model_ttl > 0 else 'disabled'}."
        )
    )

    try:
        if settings.request_threads > 0:
            # asyncio is a huge bottleneck for performance, so we use a thread pool to run blocking code
            thread_pool = ThreadPoolExecutor(settings.request_threads) if settings.request_threads > 0 else None
            log.info(f"Initialized request thread pool with {settings.request_threads} threads.")
        if settings.model_ttl > 0 and settings.model_ttl_poll_s > 0:
            asyncio.ensure_future(idle_shutdown_task())
        if settings.preload is not None:
            await preload_models(settings.preload)
        yield
    finally:
        log.handlers.clear()
        for model in model_cache.cache._cache.values():
            del model
        if thread_pool is not None:
            thread_pool.shutdown()
        gc.collect()


async def preload_models(preload: PreloadModelData) -> None:
    log.info(f"Preloading models: {preload}")
    if preload.clip is not None:
        model = await model_cache.get(preload.clip, ModelType.TEXTUAL, ModelTask.SEARCH)
        await load(model)

        model = await model_cache.get(preload.clip, ModelType.VISUAL, ModelTask.SEARCH)
        await load(model)

    if preload.facial_recognition is not None:
        model = await model_cache.get(preload.facial_recognition, ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)
        await load(model)

        model = await model_cache.get(preload.facial_recognition, ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)
        await load(model)


def update_state() -> Iterator[None]:
    global active_requests, last_called
    active_requests += 1
    last_called = time.time()
    try:
        yield
    finally:
        active_requests -= 1


app = FastAPI(lifespan=lifespan)


@app.get("/", response_model=MessageResponse)
async def root() -> dict[str, str]:
    return {"message": "Immich ML"}


@app.get("/ping", response_model=TextResponse)
def ping() -> str:
    return "pong"


@app.post("/predict", dependencies=[Depends(update_state)])
async def predict(
    model_name: str = Form(alias="modelName"),
    model_type: ModelType = Form(alias="modelType"),
    model_task: ModelTask = Form(alias="modelTask"),
    options: str = Form(default="{}"),
    text: str | None = Form(default=None),
    image: UploadFile | None = None,
) -> Any:
    if image is not None:
        inputs: str | bytes = await image.read()
    elif text is not None:
        inputs = text
    else:
        raise HTTPException(400, "Either image or text must be provided")
    try:
        kwargs = orjson.loads(options)
    except orjson.JSONDecodeError:
        raise HTTPException(400, f"Invalid options JSON: {options}")

    model = await model_cache.get(model_name, model_type, model_task, ttl=settings.model_ttl, **kwargs)
    model = await load(model)
    outputs = await run(model.predict, inputs, **kwargs)
    return ORJSONResponse(outputs)


async def run(func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
    if thread_pool is None:
        return func(*args, **kwargs)
    partial_func = partial(func, *args, **kwargs)
    return await asyncio.get_running_loop().run_in_executor(thread_pool, partial_func)


async def load(model: Predictor) -> Predictor:
    if model.loaded:
        return model

    def _load(model: Predictor) -> Predictor:
        with lock:
            model.load()
        return model

    await run(_load, model)
    return model


async def idle_shutdown_task() -> None:
    while True:
        log.debug("Checking for inactivity...")
        if (
            last_called is not None
            and not active_requests
            and not lock.locked()
            and time.time() - last_called > settings.model_ttl
        ):
            log.info("Shutting down due to inactivity.")
            os.kill(os.getpid(), signal.SIGINT)
            break
        await asyncio.sleep(settings.model_ttl_poll_s)
