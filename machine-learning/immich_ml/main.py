import asyncio
import gc
import os
import signal
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from functools import partial
from typing import Any, AsyncGenerator, Callable
from zipfile import BadZipFile

import orjson
from fastapi import Depends, FastAPI, File, Form, HTTPException
from fastapi.responses import PlainTextResponse
from onnxruntime.capi.onnxruntime_pybind11_state import InvalidProtobuf, NoSuchFile
from PIL.Image import Image
from pydantic import ValidationError
from starlette.formparsers import MultiPartParser

from immich_ml import allocator
from immich_ml.models import get_model_deps
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_pil

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
    ORJSONResponse,
    PipelineRequest,
    T,
)

MultiPartParser.spool_max_size = 2**26  # spools to disk if payload is 64 MiB or larger

model_cache = ModelCache()
thread_pool: ThreadPoolExecutor | None = None
MODEL_FILE_ERRORS = (InvalidProtobuf, NoSuchFile)
active_requests = 0
last_called: float | None = None
release: asyncio.TimerHandle | None = None


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
            allocator.release()
        yield
    finally:
        log.handlers.clear()
        model_cache.clear()
        if thread_pool is not None:
            thread_pool.shutdown()
        gc.collect()


async def preload_models(preload: PreloadModelData) -> None:
    log.info(f"Preloading models: clip:{preload.clip} facial_recognition:{preload.facial_recognition}")

    async def load_models(model_string: str, model_type: ModelType, model_task: ModelTask, **options: Any) -> None:
        for model_name in model_string.split(","):
            model_name = model_name.strip()
            model = model_cache.get(model_name, model_type, model_task, **options)
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

    if preload.ocr.detection is not None:
        await load_models(
            preload.ocr.detection,
            ModelType.DETECTION,
            ModelTask.OCR,
        )

    if preload.ocr.recognition is not None:
        await load_models(
            preload.ocr.recognition,
            ModelType.RECOGNITION,
            ModelTask.OCR,
        )


async def update_state() -> AsyncGenerator[None, None]:
    global active_requests, last_called, release
    active_requests += 1
    last_called = time.time()
    if release is not None:
        release.cancel()
        release = None
    try:
        yield
    finally:
        active_requests -= 1
        if not active_requests:
            release = asyncio.get_running_loop().call_later(5, allocator.release)


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
        decoded = await run(lambda: decode_pil(image))
        if decoded.width == 0 or decoded.height == 0:
            raise HTTPException(400, "Image has zero width or height")
        inputs: Image | str = decoded
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
        model = model_cache.get(entry["name"], entry["type"], entry["task"], ttl=settings.model_ttl, **entry["options"])
        inputs = [payload]
        for dep in model.depends:
            try:
                inputs.append(outputs[dep])
            except KeyError:
                message = f"Task {entry['task']} of type {entry['type']} depends on output of {dep}"
                raise HTTPException(400, message)
        model = await load(model)
        output = await attempt(model, partial(model.predict, *inputs, **entry["options"]), MODEL_FILE_ERRORS)
        outputs[model.identity] = output
        response[entry["task"]] = output

    for stage in entries:  # those that depend on another's output run after it
        results = await asyncio.gather(*[_run_inference(entry) for entry in stage], return_exceptions=True)
        for result in results:
            if isinstance(result, BaseException):
                raise result
    if isinstance(payload, Image):
        response["imageHeight"], response["imageWidth"] = payload.height, payload.width

    return response


async def run(func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
    if thread_pool is None:
        return func(*args, **kwargs)
    partial_func = partial(func, *args, **kwargs)
    return await asyncio.get_running_loop().run_in_executor(thread_pool, partial_func)


async def load(model: InferenceModel) -> InferenceModel:
    if not model.loaded:
        await attempt(model, model.load, (OSError, BadZipFile, *MODEL_FILE_ERRORS))
    return model


async def attempt(model: InferenceModel, func: Callable[[], T], corrupt: tuple[type[Exception], ...]) -> T:
    def _attempt() -> T:
        if not model.loaded and model.load_attempts > 1:
            raise HTTPException(500, f"Failed to load model '{model.model_name}'")
        try:
            return func()
        except FileNotFoundError as e:
            if model.model_format == ModelFormat.ONNX:
                raise e
            log.warning(
                f"{model.model_format.upper()} is available, but model '{model.model_name}' does not support it.",
                exc_info=e,
            )
            model.unload()
            model.model_format = ModelFormat.ONNX
            return func()

    try:
        return await run(_attempt)
    except corrupt:
        log.warning(f"Failed to load {model.model_type.replace('_', ' ')} model '{model.model_name}'. Clearing cache.")
        model.unload()
        model.clear_cache()
        return await run(_attempt)


async def idle_shutdown_task() -> None:
    while True:
        if last_called is not None and not active_requests and time.time() - last_called > settings.model_ttl:
            log.info("Shutting down due to inactivity.")
            os.kill(os.getpid(), signal.SIGINT)
            break
        await asyncio.sleep(settings.model_ttl_poll_s)
