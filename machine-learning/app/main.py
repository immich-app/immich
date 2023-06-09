import os
from pathlib import Path
from typing import Any, Callable
from cache import ModelCache
from schemas import (
    R,
    EmbeddingResponse,
    FaceResponse,
    TagResponse,
    MessageResponse,
    TextModelRequest,
    TextResponse,
    VisionModelRequest,
)
import uvicorn
from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, HTTPException
from models import get_model, run_classification, run_facial_recognition
import cv2 as cv

classification_model = os.getenv(
    "MACHINE_LEARNING_CLASSIFICATION_MODEL", "microsoft/resnet-50"
)
clip_image_model = os.getenv("MACHINE_LEARNING_CLIP_IMAGE_MODEL", "clip-ViT-B-32")
clip_text_model = os.getenv("MACHINE_LEARNING_CLIP_TEXT_MODEL", "clip-ViT-B-32")
facial_recognition_model = os.getenv(
    "MACHINE_LEARNING_FACIAL_RECOGNITION_MODEL", "buffalo_l"
)

min_tag_score = float(os.getenv("MACHINE_LEARNING_MIN_TAG_SCORE", 0.9))
eager_startup = (
    os.getenv("MACHINE_LEARNING_EAGER_STARTUP", "true") == "true"
)  # loads all models at startup
model_ttl = int(os.getenv("MACHINE_LEARNING_MODEL_TTL", 300))

_model_cache = None
app = FastAPI()


@app.on_event("startup")
async def startup_event() -> None:
    global _model_cache
    _model_cache = ModelCache(ttl=model_ttl, revalidate=True)
    models = [
        (classification_model, "image-classification"),
        (clip_image_model, "clip"),
        (clip_text_model, "clip"),
        (facial_recognition_model, "facial-recognition"),
    ]

    # Get all models
    for model_name, model_type in models:
        if eager_startup:
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
async def image_classification(payload: VisionModelRequest) -> list[str] | list[list[str]]:
    if _model_cache is None:
        raise HTTPException(status_code=500, detail="Unable to load model.")

    model = await _model_cache.get_cached_model(
        classification_model, "image-classification"
    )
    images = _load_images(payload.image_paths, Image.open)
    labels = run_classification(model, images, min_tag_score)
    return labels


@app.post(
    "/sentence-transformer/encode-image",
    response_model=EmbeddingResponse,
    status_code=200,
)
async def clip_encode_image(payload: VisionModelRequest) -> list[float] | list[list[float]]:
    if _model_cache is None:
        raise HTTPException(status_code=500, detail="Unable to load model.")
    if not (batched := isinstance(payload.image_paths, list)):
        image_paths = [payload.image_paths]
    else:
        image_paths = payload.image_paths

    images = _load_images(image_paths, Image.open)
    model = await _model_cache.get_cached_model(clip_image_model, "clip")
    embedding = model.encode(images).tolist()

    return embedding[0] if not batched else embedding


@app.post(
    "/sentence-transformer/encode-text",
    response_model=EmbeddingResponse,
    status_code=200,
)
async def clip_encode_text(payload: TextModelRequest) -> list[float] | list[list[float]]:
    if _model_cache is None:
        raise HTTPException(status_code=500, detail="Unable to load model.")
    if not (batched := isinstance(payload.text, list)):
        texts = [payload.text]
    else:
        texts = payload.text

    model = await _model_cache.get_cached_model(clip_text_model, "clip")
    embeddings = model.encode(texts).tolist()

    return embeddings[0] if not batched else embeddings


@app.post(
    "/facial-recognition/detect-faces", response_model=FaceResponse, status_code=200
)
async def facial_recognition(payload: VisionModelRequest) -> list[dict[str, Any]] | list[list[dict[str, Any]]]:
    if _model_cache is None:
        raise HTTPException(status_code=500, detail="Unable to load model.")
    if not (batched := isinstance(payload.image_paths, list)):
        images_paths = [payload.image_paths]
    else:
        images_paths = payload.image_paths

    images = _load_images(images_paths, cv.imread)
    model = await _model_cache.get_cached_model(
        facial_recognition_model, "facial-recognition"
    )
    batch_faces = run_facial_recognition(model, images)
    return batch_faces[0] if not batched else batch_faces


def _load_images(image_paths: str | list[str], loader: Callable[[str], R] = Image.open) -> list[R]:
    if not isinstance(image_paths, list):
        image_paths = [image_paths]

    images = []
    for i, image_path in enumerate(image_paths):
        try:
            image = loader(image_path)
            if image is None:  # cv2.imread silently returns None on failure
                if not Path(image_path).exists():
                    raise FileNotFoundError
                else:
                    raise UnidentifiedImageError
            images.append(image)
        except FileNotFoundError:
            raise HTTPException(404, f"Could not find image #{i}: {image_path}")
        except UnidentifiedImageError:
            raise HTTPException(415, f"Unable to load image #{i}: {image_path}")

    return images


if __name__ == "__main__":
    host = os.getenv("MACHINE_LEARNING_HOST", "0.0.0.0")
    port = int(os.getenv("MACHINE_LEARNING_PORT", 3003))
    is_dev = os.getenv("NODE_ENV") == "development"

    uvicorn.run("main:app", host=host, port=port, reload=is_dev, workers=1)
