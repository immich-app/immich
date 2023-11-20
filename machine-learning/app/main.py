import asyncio
import gc
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any
from zipfile import BadZipFile

import orjson
from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.responses import ORJSONResponse
from onnxruntime.capi.onnxruntime_pybind11_state import InvalidProtobuf, NoSuchFile
from starlette.formparsers import MultiPartParser

from app.models.base import InferenceModel

from .config import log, settings
from .models.cache import ModelCache
from .schemas import (
    MessageResponse,
    ModelType,
    TextResponse,
)

MultiPartParser.max_file_size = 2**26  # spools to disk if payload is 64 MiB or larger
app = FastAPI()


def init_state() -> None:
    app.state.model_cache = ModelCache(ttl=settings.model_ttl, revalidate=settings.model_ttl > 0)
    log.info(
        (
            "Created in-memory cache with unloading "
            f"{f'after {settings.model_ttl}s of inactivity' if settings.model_ttl > 0 else 'disabled'}."
        )
    )
    # asyncio is a huge bottleneck for performance, so we use a thread pool to run blocking code
    app.state.thread_pool = ThreadPoolExecutor(settings.request_threads) if settings.request_threads > 0 else None
    app.state.lock = threading.Lock()
    app.state.last_called = None
    if settings.model_ttl > 0 and settings.model_ttl_poll_s > 0:
        asyncio.ensure_future(idle_shutdown_task())
    log.info(f"Initialized request thread pool with {settings.request_threads} threads.")


@app.on_event("startup")
async def startup_event() -> None:
    init_state()


@app.get("/", response_model=MessageResponse)
async def root() -> dict[str, str]:
    return {"message": "Immich ML"}


@app.get("/ping", response_model=TextResponse)
def ping() -> str:
    return "pong"


@app.post("/predict")
async def predict(
    model_name: str = Form(alias="modelName"),
    model_type: ModelType = Form(alias="modelType"),
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

    model = await load(await app.state.model_cache.get(model_name, model_type, **kwargs))
    model.configure(**kwargs)
    outputs = await run(model, inputs)
    return ORJSONResponse(outputs)


async def run(model: InferenceModel, inputs: Any) -> Any:
    app.state.last_called = time.time()
    if app.state.thread_pool is None:
        return model.predict(inputs)
    return await asyncio.get_running_loop().run_in_executor(app.state.thread_pool, model.predict, inputs)


async def load(model: InferenceModel) -> InferenceModel:
    if model.loaded:
        return model

    def _load() -> None:
        with app.state.lock:
            model.load()

    loop = asyncio.get_running_loop()
    try:
        if app.state.thread_pool is None:
            model.load()
        else:
            await loop.run_in_executor(app.state.thread_pool, _load)
        return model
    except (OSError, InvalidProtobuf, BadZipFile, NoSuchFile):
        log.warn(
            (
                f"Failed to load {model.model_type.replace('_', ' ')} model '{model.model_name}'."
                "Clearing cache and retrying."
            )
        )
        model.clear_cache()
        if app.state.thread_pool is None:
            model.load()
        else:
            await loop.run_in_executor(app.state.thread_pool, _load)
        return model


async def idle_shutdown_task() -> None:
    while True:
        log.debug("Checking for inactivity...")
        if app.state.last_called is not None and time.time() - app.state.last_called > settings.model_ttl:
            log.info("Shutting down due to inactivity.")
            loop = asyncio.get_running_loop()
            for task in asyncio.all_tasks(loop):
                if task is not asyncio.current_task():
                    try:
                        task.cancel()
                    except asyncio.CancelledError:
                        pass
            sys.stderr.close()
            sys.stdout.close()
            sys.stdout = sys.stderr = open(os.devnull, "w")
            try:
                await app.state.model_cache.cache.clear()
                gc.collect()
                loop.stop()
            except asyncio.CancelledError:
                pass
        await asyncio.sleep(settings.model_ttl_poll_s)
