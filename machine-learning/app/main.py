import os
from io import BytesIO
from typing import Any

import cv2
import numpy as np
import uvicorn
from fastapi import Body, Depends, FastAPI
from PIL import Image

from .config import settings
from .models.base import InferenceModel
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


@app.on_event("startup")
async def startup_event() -> None:
    app.state.model_cache = ModelCache(ttl=settings.model_ttl, revalidate=True)
    same_clip = settings.clip_image_model == settings.clip_text_model
    app.state.clip_vision_type = ModelType.CLIP if same_clip else ModelType.CLIP_VISION
    app.state.clip_text_type = ModelType.CLIP if same_clip else ModelType.CLIP_TEXT
    models = [
        (settings.classification_model, ModelType.IMAGE_CLASSIFICATION),
        (settings.clip_image_model, app.state.clip_vision_type),
        (settings.clip_text_model, app.state.clip_text_type),
        (settings.facial_recognition_model, ModelType.FACIAL_RECOGNITION),
    ]

    # Get all models
    for model_name, model_type in models:
        if settings.eager_startup:
            await app.state.model_cache.get(model_name, model_type)
        else:
            InferenceModel.from_model_type(model_type, model_name)


def dep_pil_image(byte_image: bytes = Body(...)) -> Image.Image:
    return Image.open(BytesIO(byte_image))


def dep_cv_image(byte_image: bytes = Body(...)) -> cv2.Mat:
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
    model = await app.state.model_cache.get(
        settings.classification_model, ModelType.IMAGE_CLASSIFICATION
    )
    labels = model.predict(image)
    return labels


@app.post(
    "/sentence-transformer/encode-image",
    response_model=EmbeddingResponse,
    status_code=200,
)
async def clip_encode_image(
    image: Image.Image = Depends(dep_pil_image),
) -> list[float]:
    model = await app.state.model_cache.get(
        settings.clip_image_model, app.state.clip_vision_type
    )
    embedding = model.predict(image)
    return embedding


@app.post(
    "/sentence-transformer/encode-text",
    response_model=EmbeddingResponse,
    status_code=200,
)
async def clip_encode_text(payload: TextModelRequest) -> list[float]:
    model = await app.state.model_cache.get(
        settings.clip_text_model, app.state.clip_text_type
    )
    embedding = model.predict(payload.text)
    return embedding


@app.post(
    "/facial-recognition/detect-faces",
    response_model=FaceResponse,
    status_code=200,
)
async def facial_recognition(
    image: cv2.Mat = Depends(dep_cv_image),
) -> list[dict[str, Any]]:
    model = await app.state.model_cache.get(
        settings.facial_recognition_model, ModelType.FACIAL_RECOGNITION
    )
    faces = model.predict(image)
    return faces


if __name__ == "__main__":
    is_dev = os.getenv("NODE_ENV") == "development"
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=is_dev,
        workers=settings.workers,
    )
