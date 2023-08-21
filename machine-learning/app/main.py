import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from typing import Any

import cv2
import numpy as np
import uvicorn
from fastapi import Body, Depends, FastAPI
from PIL import Image

from app.models.base import InferenceModel

from .config import settings
from .models.cache import ModelCache
from .schemas import (
    EmbeddingResponse,
    FaceResponse,
    MessageResponse,
    ModelType,
    TagResponse,
    TextModelRequest,
    TextResponse,
)

app = FastAPI()


def init_state() -> None:
    app.state.model_cache = ModelCache(ttl=settings.model_ttl, revalidate=settings.model_ttl > 0)
    # asyncio is a huge bottleneck for performance, so we use a thread pool to run blocking code
    app.state.thread_pool = ThreadPoolExecutor(settings.request_threads)


async def load_models() -> None:
    models: list[tuple[str, ModelType, dict[str, Any]]] = [
        (settings.classification_model, ModelType.IMAGE_CLASSIFICATION, {}),
        (settings.clip_image_model, ModelType.CLIP, {"mode": "vision"}),
        (settings.clip_text_model, ModelType.CLIP, {"mode": "text"}),
        (settings.facial_recognition_model, ModelType.FACIAL_RECOGNITION, {}),
    ]

    # Get all models
    for model_name, model_type, model_kwargs in models:
        await app.state.model_cache.get(model_name, model_type, eager=settings.eager_startup, **model_kwargs)


@app.on_event("startup")
async def startup_event() -> None:
    init_state()
    await load_models()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    app.state.thread_pool.shutdown()


def dep_pil_image(byte_image: bytes = Body(...)) -> Image.Image:
    return Image.open(BytesIO(byte_image))


def dep_cv_image(byte_image: bytes = Body(...)) -> np.ndarray[int, np.dtype[Any]]:
    byte_image_np = np.frombuffer(byte_image, np.uint8)
    return cv2.imdecode(byte_image_np, cv2.IMREAD_COLOR)


@app.get("/", response_model=MessageResponse)
async def root() -> dict[str, str]:
    return {"message": "Immich ML"}


@app.get("/ping", response_model=TextResponse)
def ping() -> str:
    return "pong"


@app.post(
    "/image-classifier/tag-image",
    response_model=TagResponse,
    status_code=200,
)
async def image_classification(
    image: Image.Image = Depends(dep_pil_image),
) -> list[str]:
    model = await app.state.model_cache.get(settings.classification_model, ModelType.IMAGE_CLASSIFICATION)
    labels = await predict(model, image)
    return labels


@app.post(
    "/sentence-transformer/encode-image",
    response_model=EmbeddingResponse,
    status_code=200,
)
async def clip_encode_image(
    image: Image.Image = Depends(dep_pil_image),
) -> list[float]:
    model = await app.state.model_cache.get(settings.clip_image_model, ModelType.CLIP, mode="vision")
    embedding = await predict(model, image)
    return embedding


@app.post(
    "/sentence-transformer/encode-text",
    response_model=EmbeddingResponse,
    status_code=200,
)
async def clip_encode_text(payload: TextModelRequest) -> list[float]:
    model = await app.state.model_cache.get(settings.clip_text_model, ModelType.CLIP, mode="text")
    embedding = await predict(model, payload.text)
    return embedding


@app.post(
    "/facial-recognition/detect-faces",
    response_model=FaceResponse,
    status_code=200,
)
async def facial_recognition(
    image: cv2.Mat = Depends(dep_cv_image),
) -> list[dict[str, Any]]:
    model = await app.state.model_cache.get(settings.facial_recognition_model, ModelType.FACIAL_RECOGNITION)
    faces = await predict(model, image)
    return faces


async def predict(model: InferenceModel, inputs: Any) -> Any:
    return await asyncio.get_running_loop().run_in_executor(app.state.thread_pool, model.predict, inputs)


if __name__ == "__main__":
    is_dev = os.getenv("NODE_ENV") == "development"
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=is_dev,
        workers=settings.workers,
    )
