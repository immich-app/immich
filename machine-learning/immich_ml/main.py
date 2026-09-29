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
from fastapi.responses import JSONResponse, PlainTextResponse
from onnxruntime.capi.onnxruntime_pybind11_state import InvalidProtobuf, NoSuchFile
from PIL.Image import Image
from pydantic import TypeAdapter, ValidationError
from starlette.formparsers import MultiPartParser

from immich_ml import allocator
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_pil
from immich_ml.sessions.ort import flush_denormals

from .config import PreloadModelData, log, settings
from .models.base import InferenceEntry
from .models.cache import ModelCache
from .pipeline import Clip, FacialRecognition, Ocr, PipelineRequest, Slot
from .schemas import (
    FaceDetectionOptions,
    FaceRecognitionOptions,
    InferenceResponse,
    ModelFormat,
    ModelIdentity,
    Options,
    TextDetectionOptions,
    TextRecognitionOptions,
    TextualOptions,
    VisualOptions,
)


class ORJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        return orjson.dumps(content, option=orjson.OPT_SERIALIZE_NUMPY)


PIPELINE_REQUEST = TypeAdapter(PipelineRequest)
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
        flush_denormals()  # for work that runs on the event loop's own thread
        if settings.request_threads > 0:
            # asyncio is a huge bottleneck for performance, so we use a thread pool to run blocking code
            thread_pool = ThreadPoolExecutor(settings.request_threads, initializer=flush_denormals)
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
    requests = [
        *(PipelineRequest(clip=Clip(textual=Slot(name, TextualOptions()))) for name in _names(preload.clip.textual)),
        *(PipelineRequest(clip=Clip(visual=Slot(name, VisualOptions()))) for name in _names(preload.clip.visual)),
        *(
            PipelineRequest(facial_recognition=FacialRecognition(detection=Slot(name, FaceDetectionOptions())))
            for name in _names(preload.facial_recognition.detection)
        ),
        *(
            PipelineRequest(facial_recognition=FacialRecognition(recognition=Slot(name, FaceRecognitionOptions())))
            for name in _names(preload.facial_recognition.recognition)
        ),
        *(
            PipelineRequest(
                ocr=Ocr(detection=Slot(name, TextDetectionOptions(max_resolution=preload.ocr.max_resolution)))
            )
            for name in _names(preload.ocr.detection)
        ),
        *(
            PipelineRequest(ocr=Ocr(recognition=Slot(name, TextRecognitionOptions())))
            for name in _names(preload.ocr.recognition)
        ),
    ]
    for entry in (entry for request in requests for entry in request.entries()):
        await _preload(entry)


async def _preload[O: Options](entry: InferenceEntry[O]) -> None:
    log.info(f"Preloading: {entry}")
    model = await load(model_cache.get(entry))
    await attempt(model, model.build, MODEL_FILE_ERRORS)


def _names(setting: str | None) -> list[str]:
    return [] if setting is None else [name.strip() for name in setting.split(",")]


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


def get_entries(entries: str = Form()) -> list[InferenceEntry[Any]]:
    try:
        found = list(PIPELINE_REQUEST.validate_json(entries).entries())
    except (ValidationError, ValueError) as e:
        log.error(f"Invalid request format: {e}")
        raise HTTPException(422, "Invalid request format.")
    if not found:
        raise HTTPException(422, "No model task requested.")
    return found


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root() -> ORJSONResponse:
    return ORJSONResponse({"message": "Immich ML"})


@app.get("/ping")
def ping() -> PlainTextResponse:
    return PlainTextResponse("pong")


@app.post("/predict", dependencies=[Depends(update_state)])
async def predict(
    entries: list[InferenceEntry[Any]] = Depends(get_entries),
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


async def run_inference(payload: Image | str, entries: list[InferenceEntry[Any]]) -> InferenceResponse:
    read: set[ModelIdentity] = set()

    async def _run_inference[O: Options](entry: InferenceEntry[O]) -> Any:
        model = model_cache.get(entry, ttl=settings.model_ttl)
        read.update(model.depends)
        if missing := [dep for dep in model.depends if dep not in runs]:
            raise HTTPException(400, f"{entry.model.__name__} depends on output of {missing[0]}")
        inputs = [payload, *[await runs[dep] for dep in model.depends]]
        model = await load(model)
        return await attempt(model, partial(model.predict, *inputs, options=entry.options), MODEL_FILE_ERRORS)

    runs = {entry.model.identity: asyncio.create_task(_run_inference(entry)) for entry in entries}
    outputs = await asyncio.gather(*runs.values(), return_exceptions=True)
    for output in outputs:
        if isinstance(output, BaseException):
            raise output
    response: InferenceResponse = {  # a task answers with the output no other model of it reads
        entry.model.identity[1].value: output
        for entry, output in zip(entries, outputs)
        if entry.model.identity not in read
    }
    if isinstance(payload, Image):
        response["imageHeight"], response["imageWidth"] = payload.height, payload.width

    return response


async def run[R](func: Callable[[], R]) -> R:
    if thread_pool is None:
        return func()
    return await asyncio.get_running_loop().run_in_executor(thread_pool, func)


async def load[O: Options](model: InferenceModel[O]) -> InferenceModel[O]:
    if not model.loaded:
        await attempt(model, model.load, (OSError, BadZipFile, *MODEL_FILE_ERRORS))
    return model


async def attempt[O: Options, R](
    model: InferenceModel[O], func: Callable[[], R], corrupt: tuple[type[Exception], ...]
) -> R:
    def _attempt() -> R:
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
