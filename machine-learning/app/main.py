import os
import io
from typing import Any

from cache import ModelCache
from schemas import (
    EmbeddingResponse,
    FaceResponse,
    TagResponse,
    MessageResponse,
    TextModelRequest,
    TextResponse,
)
import uvicorn
from PIL import Image
from fastapi import FastAPI, HTTPException, Depends, Body
from models import get_model, run_classification, run_facial_recognition
from config import settings

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


def dep_model_cache():
    if _model_cache is None:
        raise HTTPException(status_code=500, detail="Unable to load model.")

def dep_input_image(image: bytes = Body(...)) -> Image:
    return Image.open(io.BytesIO(image))

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
    dependencies=[Depends(dep_model_cache)],
)
async def image_classification(
    image: Image = Depends(dep_input_image)
) -> list[str]:
    try:
        model = await _model_cache.get_cached_model(
            settings.classification_model, "image-classification"
        )
        labels = run_classification(model, image, settings.min_tag_score)
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))
    else:
        return labels


@app.post(
    "/sentence-transformer/encode-image",
    response_model=EmbeddingResponse,
    status_code=200,
    dependencies=[Depends(dep_model_cache)],
)
async def clip_encode_image(
    image: Image = Depends(dep_input_image)
) -> list[float]:
    model = await _model_cache.get_cached_model(settings.clip_image_model, "clip")
    embedding = model.encode(image).tolist()
    return embedding


@app.post(
    "/sentence-transformer/encode-text",
    response_model=EmbeddingResponse,
    status_code=200,
    dependencies=[Depends(dep_model_cache)],
)
async def clip_encode_text(
    payload: TextModelRequest
) -> list[float]:
    model = await _model_cache.get_cached_model(settings.clip_text_model, "clip")
    embedding = model.encode(payload.text).tolist()
    return embedding


@app.post(
    "/facial-recognition/detect-faces",
    response_model=FaceResponse,
    status_code=200,
    dependencies=[Depends(dep_model_cache)],
)
async def facial_recognition(
    image: bytes = Body(...),
) -> list[dict[str, Any]]:
    model = await _model_cache.get_cached_model(
        settings.facial_recognition_model, "facial-recognition"
    )
    faces = run_facial_recognition(model, image)
    return faces


if __name__ == "__main__":
    is_dev = os.getenv("NODE_ENV") == "development"
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=is_dev,
        workers=settings.workers,
    )
