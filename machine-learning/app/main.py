import os
from typing import Any

from cache import ModelCache
from schemas import (
    EmbeddingResponse,
    FaceResponse,
    TagResponse,
    MessageResponse,
    TextModelRequest,
    TextResponse,
    VisionModelRequest,
)
import uvicorn

from PIL import Image
from fastapi import FastAPI, HTTPException, Depends
from models import get_model, run_classification, run_facial_recognition
from config import get_settings, Settings

settings = get_settings()

_model_cache = None


app = FastAPI()


@app.on_event("startup")
async def startup_event() -> None:
    global _model_cache
    _model_cache = ModelCache(ttl=settings.model_ttl, revalidate=True)
    models = [
        (settings.classification_model, "image-classification"),
        (settings.clip_image_model, "clip"),
        (settings.clip_text_model, "clip"),
        (settings.facial_recognition_model, "facial-recognition"),
    ]

    # Get all models
    for model_name, model_type in models:
        if settings.eager_startup:
            await _model_cache.get_cached_model(model_name, model_type)
        else:
            get_model(model_name, model_type)


@app.get("/", response_model=MessageResponse)
async def root() -> dict[str, str]:
    return {"message": "Immich ML"}


@app.get("/ping", response_model=TextResponse)
def ping() -> str:
    return "pong"


@app.post("/image-classifier/tag-image", response_model=TagResponse, status_code=200)
async def image_classification(payload: VisionModelRequest, settings: Settings = Depends(get_settings)) -> list[str]:
    if _model_cache is None:
        raise HTTPException(status_code=500, detail="Unable to load model.")

    model = await _model_cache.get_cached_model(
        settings.classification_model, "image-classification"
    )
    labels = run_classification(model, payload.image_path, settings.min_tag_score)
    return labels


@app.post(
    "/sentence-transformer/encode-image",
    response_model=EmbeddingResponse,
    status_code=200,
)
async def clip_encode_image(payload: VisionModelRequest, settings: Settings = Depends(get_settings)) -> list[float]:
    if _model_cache is None:
        raise HTTPException(status_code=500, detail="Unable to load model.")

    model = await _model_cache.get_cached_model(settings.clip_image_model, "clip")
    image = Image.open(payload.image_path)
    embedding = model.encode(image).tolist()
    return embedding


@app.post(
    "/sentence-transformer/encode-text",
    response_model=EmbeddingResponse,
    status_code=200,
)
async def clip_encode_text(payload: TextModelRequest, settings: Settings = Depends(get_settings)) -> list[float]:
    if _model_cache is None:
        raise HTTPException(status_code=500, detail="Unable to load model.")

    model = await _model_cache.get_cached_model(settings.clip_text_model, "clip")
    embedding = model.encode(payload.text).tolist()
    return embedding


@app.post(
    "/facial-recognition/detect-faces", response_model=FaceResponse, status_code=200
)
async def facial_recognition(payload: VisionModelRequest, settings: Settings = Depends(get_settings)) -> list[dict[str, Any]]:
    if _model_cache is None:
        raise HTTPException(status_code=500, detail="Unable to load model.")

    model = await _model_cache.get_cached_model(
        settings.facial_recognition_model, "facial-recognition"
    )
    faces = run_facial_recognition(model, payload.image_path)
    return faces


if __name__ == "__main__":
    host = os.getenv("MACHINE_LEARNING_HOST", "0.0.0.0")
    port = int(os.getenv("MACHINE_LEARNING_PORT", 3003))
    is_dev = os.getenv("NODE_ENV") == "development"

    uvicorn.run("main:app", host=host, port=port, reload=is_dev, workers=1)
