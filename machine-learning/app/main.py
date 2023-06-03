import os
from typing import Any
from schemas import (
    EmbeddingResponse,
    FaceResponse,
    TagResponse,
    MessageResponse,
    TextModelRequest,
    TextResponse,
    VisionModelRequest,
)
import cv2 as cv
import uvicorn

from insightface.app import FaceAnalysis
from transformers import pipeline
from sentence_transformers import SentenceTransformer
from transformers import Pipeline
from PIL import Image
from fastapi import FastAPI


classification_model = os.getenv(
    "MACHINE_LEARNING_CLASSIFICATION_MODEL", "microsoft/resnet-50"
)
clip_image_model = os.getenv("MACHINE_LEARNING_CLIP_IMAGE_MODEL", "clip-ViT-B-32")
clip_text_model = os.getenv("MACHINE_LEARNING_CLIP_TEXT_MODEL", "clip-ViT-B-32")
facial_recognition_model = os.getenv(
    "MACHINE_LEARNING_FACIAL_RECOGNITION_MODEL", "buffalo_l"
)

min_face_score = float(os.getenv("MACHINE_LEARNING_MIN_FACE_SCORE", 0.7))
min_tag_score = float(os.getenv("MACHINE_LEARNING_MIN_TAG_SCORE", 0.9))
eager_startup = (
    os.getenv("MACHINE_LEARNING_EAGER_STARTUP", "true") == "true"
)  # loads all models at startup

cache_folder = os.getenv("MACHINE_LEARNING_CACHE_FOLDER", "/cache")

_model_cache = {}

app = FastAPI()


@app.on_event("startup")
async def startup_event() -> None:
    models = [
        (classification_model, "image-classification"),
        (clip_image_model, "clip"),
        (clip_text_model, "clip"),
        (facial_recognition_model, "facial-recognition"),
    ]

    # Get all models
    for model_name, model_type in models:
        if eager_startup:
            get_cached_model(model_name, model_type)
        else:
            _get_model(model_name, model_type)


@app.get("/", response_model=MessageResponse)
async def root() -> dict[str, str]:
    return {"message": "Immich ML"}


@app.get("/ping", response_model=TextResponse)
def ping() -> str:
    return "pong"


@app.post("/image-classifier/tag-image", response_model=TagResponse, status_code=200)
def image_classification(payload: VisionModelRequest) -> list[str]:
    model = get_cached_model(classification_model, "image-classification")
    assetPath = payload.image_path
    labels = run_engine(model, assetPath)
    return labels


@app.post(
    "/sentence-transformer/encode-image",
    response_model=EmbeddingResponse,
    status_code=200,
)
def clip_encode_image(payload: VisionModelRequest) -> list[float]:
    model = get_cached_model(clip_image_model, "clip")
    image = Image.open(payload.image_path)
    return model.encode(image).tolist()


@app.post(
    "/sentence-transformer/encode-text",
    response_model=EmbeddingResponse,
    status_code=200,
)
def clip_encode_text(payload: TextModelRequest) -> list[float]:
    model = get_cached_model(clip_text_model, "clip")
    return model.encode(payload.text).tolist()


@app.post(
    "/facial-recognition/detect-faces", response_model=FaceResponse, status_code=200
)
def facial_recognition(payload: VisionModelRequest) -> list[dict[str, Any]]:
    model = get_cached_model(facial_recognition_model, "facial-recognition")
    img = cv.imread(payload.image_path)
    height, width, _ = img.shape
    results = []
    faces = model.get(img)

    for face in faces:
        if face.det_score < min_face_score:
            continue
        x1, y1, x2, y2 = face.bbox

        results.append(
            {
                "imageWidth": width,
                "imageHeight": height,
                "boundingBox": {
                    "x1": round(x1),
                    "y1": round(y1),
                    "x2": round(x2),
                    "y2": round(y2),
                },
                "score": face.det_score.item(),
                "embedding": face.normed_embedding.tolist(),
            }
        )
    return results


def run_engine(engine: Pipeline, path: str) -> list[str]:
    result: list[str] = []
    predictions: list[dict[str, Any]] = engine(path)  # type: ignore

    for pred in predictions:
        tags = pred["label"].split(", ")
        if pred["score"] > min_tag_score:
            result = [*result, *tags]

    if len(result) > 1:
        result = list(set(result))

    return result


def get_cached_model(model, task) -> Any:
    global _model_cache
    key = "|".join([model, str(task)])
    if key not in _model_cache:
        model = _get_model(model, task)
        _model_cache[key] = model

    return _model_cache[key]


def _get_model(model, task) -> Any:
    match task:
        case "facial-recognition":
            model = FaceAnalysis(
                name=model,
                root=cache_folder,
                allowed_modules=["detection", "recognition"],
            )
            model.prepare(ctx_id=0, det_size=(640, 640))
        case "clip":
            model = SentenceTransformer(model, cache_folder=cache_folder)
        case _:
            model = pipeline(model=model, task=task)
    return model


if __name__ == "__main__":
    host = os.getenv("MACHINE_LEARNING_HOST", "0.0.0.0")
    port = int(os.getenv("MACHINE_LEARNING_PORT", 3003))
    is_dev = os.getenv("NODE_ENV") == "development"

    uvicorn.run("main:app", host=host, port=port, reload=is_dev, workers=1)
