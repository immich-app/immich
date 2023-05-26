import torch  # note: this must be called before onnxruntime if using cuda, as ort relies on the cuda libraries loaded by torch
import os
import cv2 as cv
import uvicorn

from PIL import Image
from fastapi import FastAPI
from pydantic import BaseModel
from models import (
    init_clip_text,
    init_clip_vision,
    init_facial_recognition,
    init_image_classifier,
)
from transformers import CLIPTokenizerFast, AutoImageProcessor


class MlRequestBody(BaseModel):
    thumbnailPath: str


class ClipRequestBody(BaseModel):
    text: str


classification_model = os.getenv(
    "MACHINE_LEARNING_CLASSIFICATION_MODEL", "microsoft/beit-base-patch16-224"
)
clip_model = os.getenv("MACHINE_LEARNING_CLIP_MODEL", "openai/clip-vit-base-patch32")
facial_recognition_model = os.getenv(
    "MACHINE_LEARNING_FACIAL_RECOGNITION_MODEL", "buffalo_l"
)
MIN_FACIAL_RECOGNITION_SCORE = float(os.getenv("MIN_FACIAL_RECOGNITION_SCORE", 0.7))
MIN_IMAGE_CLASSIFICATION_SCORE = float(os.getenv("MIN_IMAGE_CLASSIFICATION_SCORE", 0.1))
_model_cache = {}

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    # Get all models
    _get_model(classification_model, "image-classification")
    _get_model(clip_model, "clip-text")
    _get_model(clip_model, "clip-vision")
    _get_model(facial_recognition_model, "facial-recognition")


@app.get("/")
async def root():
    return {"message": "Immich ML"}


@app.get("/ping")
def ping():
    return "pong"


@app.post("/image-classifier/tag-image", status_code=200)
def image_classification(payload: MlRequestBody):
    model = _get_model(classification_model, "image-classification")
    assetPath = payload.thumbnailPath
    outputs = model(assetPath)
    labels = [
        output["label"]
        for output in outputs
        if output["score"] >= MIN_IMAGE_CLASSIFICATION_SCORE
    ]

    return labels


@app.post("/clip/encode-image", status_code=200)
def clip_encode_image(payload: MlRequestBody):
    model = _get_model(clip_model, "clip-vision")
    processor = _get_model(clip_model, "clip-processor")
    image = Image.open(payload.thumbnailPath)
    inputs = processor(image, return_tensors="np")
    embeddings = model.run(
        input_feed=dict(inputs),
        output_names=["image_embeds"],
    )
    return embeddings[0].squeeze().tolist()


@app.post("/clip/encode-text", status_code=200)
def clip_encode_text(payload: ClipRequestBody):
    model = _get_model(clip_model, "clip-text")
    tokenizer = _get_model(clip_model, "clip-tokenizer")

    tokens = tokenizer(payload.text, return_tensors="np")
    embeddings = model.run(
        input_feed={
            "input_ids": tokens.input_ids,
            "attention_mask": tokens.attention_mask,
        },
        output_names=["text_embeds"],
    )
    return embeddings[0].squeeze().tolist()


@app.post("/facial-recognition/detect-faces", status_code=200)
def facial_recognition(payload: MlRequestBody):
    model = _get_model(facial_recognition_model, "facial-recognition")
    assetPath = payload.thumbnailPath
    img = cv.imread(assetPath)
    height, width, _ = img.shape
    faces = model.get(img)

    results = [
        {
            "imageWidth": width,
            "imageHeight": height,
            "boundingBox": {
                "x1": round(face.bbox[0]),
                "y1": round(face.bbox[1]),
                "x2": round(face.bbox[2]),
                "y2": round(face.bbox[3]),
            },
            "score": face.det_score.item(),
            "embedding": face.normed_embedding.tolist(),
        }
        for face in faces
        if face.det_score >= MIN_FACIAL_RECOGNITION_SCORE
    ]

    return results


def _get_model(model_name, task):
    global _model_cache
    if task not in _model_cache:
        match task:
            case "image-classification":
                _model_cache[task] = init_image_classifier(model_name)
            case "clip-vision":
                _model_cache[task] = init_clip_vision(model_name)
            case "clip-processor":
                _model_cache["clip-processor"] = AutoImageProcessor.from_pretrained(
                    model_name
                )
            case "clip-text":
                _model_cache[task] = init_clip_text(model_name)
            case "clip-tokenizer":
                _model_cache["clip-tokenizer"] = CLIPTokenizerFast.from_pretrained(
                    model_name
                )
            case "facial-recognition":
                _model_cache[task] = init_facial_recognition(model_name)
            case _:
                raise ValueError(f"Invalid task specified: {task}")

    return _model_cache[task]


if __name__ == "__main__":
    host = os.getenv("MACHINE_LEARNING_HOST", "0.0.0.0")
    port = int(os.getenv("MACHINE_LEARNING_PORT", 3003))
    is_dev = os.getenv("NODE_ENV") == "development"
    uvicorn.run("main:app", host=host, port=port, reload=is_dev, workers=1)
