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
from zipfile import BadZipFile

import orjson
from fastapi import Depends, FastAPI, File, Form, HTTPException
from fastapi.responses import ORJSONResponse, PlainTextResponse
from onnxruntime.capi.onnxruntime_pybind11_state import InvalidProtobuf, NoSuchFile
from PIL.Image import Image
from pydantic import ValidationError
from starlette.formparsers import MultiPartParser

from app.models import get_model_deps
from app.models.base import InferenceModel
from app.models.transforms import decode_pil

from .config import PreloadModelData, log, settings
from .models.cache import ModelCache
from .schemas import (
    InferenceEntries,
    InferenceEntry,
    InferenceResponse,
    ModelFormat,
    ModelIdentity,
    ModelTask,
    ModelType,
    PipelineRequest,
    T,
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
    log.info(f"Preloading models: clip:{preload.clip} facial_recognition:{preload.facial_recognition}")

    async def load_models(model_string: str, model_type: ModelType, model_task: ModelTask) -> None:
        for model_name in model_string.split(","):
            model_name = model_name.strip()
            model = await model_cache.get(model_name, model_type, model_task)
            await load(model)

    if preload.clip.textual is not None:
        await load_models(preload.clip.textual, ModelType.TEXTUAL, ModelTask.SEARCH)

    if preload.clip.visual is not None:
        await load_models(preload.clip.visual, ModelType.VISUAL, ModelTask.SEARCH)

    if preload.facial_recognition.detection is not None:
        await load_models(
            preload.facial_recognition.detection,
            ModelType.DETECTION,
            ModelTask.FACIAL_RECOGNITION,
        )

    if preload.facial_recognition.recognition is not None:
        await load_models(
            preload.facial_recognition.recognition,
            ModelType.RECOGNITION,
            ModelTask.FACIAL_RECOGNITION,
        )

    if preload.clip_fallback is not None:
        log.warning(
            "Deprecated env variable: 'MACHINE_LEARNING_PRELOAD__CLIP'. "
            "Use 'MACHINE_LEARNING_PRELOAD__CLIP__TEXTUAL' and "
            "'MACHINE_LEARNING_PRELOAD__CLIP__VISUAL' instead."
        )

    if preload.facial_recognition_fallback is not None:
        log.warning(
            "Deprecated env variable: 'MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION'. "
            "Use 'MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION__DETECTION' and "
            "'MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION__RECOGNITION' instead."
        )


def update_state() -> Iterator[None]:
    global active_requests, last_called
    active_requests += 1
    last_called = time.time()
    try:
        yield
    finally:
        active_requests -= 1


def get_entries(entries: str = Form()) -> InferenceEntries:
    try:
        request: PipelineRequest = orjson.loads(entries)
        without_deps: list[InferenceEntry] = []
        with_deps: list[InferenceEntry] = []
        for task, types in request.items():
            for type, entry in types.items():
                parsed: InferenceEntry = {
                    "name": entry["modelName"],
                    "task": task,
                    "type": type,
                    "options": entry.get("options", {}),
                }
                dep = get_model_deps(parsed["name"], type, task)
                (with_deps if dep else without_deps).append(parsed)
        return without_deps, with_deps
    except (orjson.JSONDecodeError, ValidationError, KeyError, AttributeError) as e:
        log.error(f"Invalid request format: {e}")
        raise HTTPException(422, "Invalid request format.")


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root() -> ORJSONResponse:
    return ORJSONResponse({"message": "Immich ML"})


@app.get("/ping")
def ping() -> PlainTextResponse:
    return PlainTextResponse("pong")


@app.post("/predict", dependencies=[Depends(update_state)])
async def predict(
    entries: InferenceEntries = Depends(get_entries),
    image: bytes | None = File(default=None),
    text: str | None = Form(default=None),
) -> Any:
    if image is not None:
        inputs: Image | str = await run(lambda: decode_pil(image))
    elif text is not None:
        inputs = text
    else:
        raise HTTPException(400, "Either image or text must be provided")
    response = await run_inference(inputs, entries)
    return ORJSONResponse(response)


async def run_inference(payload: Image | str, entries: InferenceEntries) -> InferenceResponse:
    outputs: dict[ModelIdentity, Any] = {}
    response: InferenceResponse = {}

    async def _run_inference(entry: InferenceEntry) -> None:
        model = await model_cache.get(entry["name"], entry["type"], entry["task"], ttl=settings.model_ttl)
        inputs = [payload]
        for dep in model.depends:
            try:
                inputs.append(outputs[dep])
            except KeyError:
                message = f"Task {entry['task']} of type {entry['type']} depends on output of {dep}"
                raise HTTPException(400, message)
        model = await load(model)
        output = await run(model.predict, *inputs, **entry["options"])
        outputs[model.identity] = output
        response[entry["task"]] = output

    without_deps, with_deps = entries
    await asyncio.gather(*[_run_inference(entry) for entry in without_deps])
    if with_deps:
        await asyncio.gather(*[_run_inference(entry) for entry in with_deps])
    if isinstance(payload, Image):
        response["imageHeight"], response["imageWidth"] = payload.height, payload.width

    return response


async def run(func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
    if thread_pool is None:
        return func(*args, **kwargs)
    partial_func = partial(func, *args, **kwargs)
    return await asyncio.get_running_loop().run_in_executor(thread_pool, partial_func)


async def load(model: InferenceModel) -> InferenceModel:
    if model.loaded:
        return model

    def _load(model: InferenceModel) -> InferenceModel:
        if model.load_attempts > 1:
            raise HTTPException(500, f"Failed to load model '{model.model_name}'")
        with lock:
            try:
                model.load()
            except FileNotFoundError as e:
                if model.model_format == ModelFormat.ONNX:
                    raise e
                log.exception(e)
                log.warning(
                    f"{model.model_format.upper()} is available, but model '{model.model_name}' does not support it."
                )
                model.model_format = ModelFormat.ONNX
                model.load()
        return model

    try:
        return await run(_load, model)
    except (OSError, InvalidProtobuf, BadZipFile, NoSuchFile):
        log.warning(f"Failed to load {model.model_type.replace('_', ' ')} model '{model.model_name}'. Clearing cache.")
        model.clear_cache()
        return await run(_load, model)


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
