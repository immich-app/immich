from typing import Any
import torch  # note: this must be called before onnxruntime if using cuda, as ort relies on the cuda libraries loaded by torch
import os
import onnxruntime as ort
import cv2 as cv
import uvicorn
from uvicorn.logging import ColourizedFormatter
from PIL import Image
from fastapi import FastAPI
from models import get_model
from aiocache import Cache
from insightface.app import FaceAnalysis
from transformers.pipelines import ImageClassificationPipeline
from transformers.image_processing_utils import BaseImageProcessor
from transformers.processing_utils import PreTrainedTokenizerBase
import dto
import logging
log = logging.getLogger()
log.setLevel(logging.INFO)

classification_model = os.getenv(
    "MACHINE_LEARNING_CLASSIFICATION_MODEL", "microsoft/beit-base-patch16-224"
)
clip_model = os.getenv("MACHINE_LEARNING_CLIP_IMAGE_MODEL", "openai/clip-vit-base-patch32")
face_model = os.getenv("MACHINE_LEARNING_FACIAL_RECOGNITION_MODEL", "buffalo_l")
min_face_score = float(os.getenv("MACHINE_LEARNING_MIN_FACE_SCORE", 0.7))
min_tag_score = float(os.getenv("MACHINE_LEARNING_MIN_TAG_SCORE", 0.1))
eager_startup = os.getenv("MACHINE_LEARNING_EAGER_STARTUP", "true") == "true"  # loads all models at startup
model_ttl = int(os.getenv("MACHINE_LEARNING_MODEL_TTL", 300))  # models are unloaded if unused for this duration

model_type_to_name = {
    "image-classification": classification_model,
    "clip-text": clip_model,
    "clip-vision": clip_model,
    "facial-recognition": face_model,
}


# since it's async, this can enforce ttl by scheduling models for deletion in the event loop
model_cache = Cache(Cache.MEMORY)


async def get_cached_model(model_name: str, model_type: str) -> Any:
    """
    Fetches a model from the model cache, instantiating it if it's missing.
    It also resets the model TTL to ensure the model stays in memory while still in use.

    Args:
        model_name (str): Name of model in the model zoo used for the task.
        model_type (str):
            Model type or task, which determines which model zoo is used.
            `facial-recognition` uses Insightface, while all other models use the HF Model Hub.
         
            Options:
                `image-classification`, `clip-vision`, `clip-text`, `facial-recognition`, `tokenizer`, `processor`

    Returns:
        model: The requested model.
    """

    model = await model_cache.get(model_name, namespace=model_type)
    if not model:
        model = get_model(model_name, model_type)

    await model_cache.set(model_name, model, ttl=model_ttl, namespace=model_type)  # resets ttl
    return model

app = FastAPI()


@app.on_event("startup")
async def startup_event() -> None:
    # TODO logging conf to pass to uvicorn directly
    console_formatter = ColourizedFormatter(
        "{levelprefix} {message}",
        style="{", use_colors=True)
    handler = logging.StreamHandler()
    handler.setFormatter(console_formatter)
    log.addHandler(handler)
    
    if not eager_startup:
        log.info("Eager startup mode is disabled. Lazily loading models.")
        return

    # # Get all models
    for model_type, model_name in model_type_to_name.items():
        log.info(f"Loading {' '.join(model_type.split('-'))} model...")
        model = get_model(model_name, model_type)
        await model_cache.add(model_name, model, ttl=model_ttl, namespace=model_type)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Immich ML"}


@app.get("/ping")
def ping() -> str:
    return "pong"


@app.post("/image-classifier/tag-image", status_code=200)
async def image_classification(payload: dto.VisionModelRequest) -> list[str]:
    """
    Image classification endpoint. Uses a Hugging Face pipeline with an ONNX model backend.
    The model will be automatically loaded if it isn't already loaded.

    Args:
        payload: Request containing the path of the image to process.

    Returns:
        labels: The labels for the image.
    """

    model: ImageClassificationPipeline = await get_cached_model(classification_model, "image-classification")  # type: ignore
    outputs = model(payload.image_path)
    labels: list[str] = [output["label"] for output in outputs if output["score"] >= min_tag_score]  # type: ignore

    return labels


@app.post("/clip/encode-image", status_code=200)
async def clip_encode_image(payload: dto.VisionModelRequest) -> list[float]:
    """
    CLIP image model endpoint. Uses an ONNX Runtime InferenceSession as the model backend.
    The model will be automatically loaded if it isn't already loaded.

    Args:
        payload: Request containing the path of the image to process.

    Returns:
        embedding: The embedding produced from the model.
    """

    model: ort.InferenceSession = await get_cached_model(clip_model, "clip-vision")  # type: ignore
    processor: BaseImageProcessor = await get_cached_model(clip_model, "processor")  # type: ignore
    image = Image.open(payload.image_path)
    inputs = processor(image, return_tensors="np")
    embeddings = model.run(
        input_feed=dict(inputs),
        output_names=["image_embeds"],
    )
    return embeddings[0].squeeze().tolist()


@app.post("/clip/encode-text", status_code=200)
async def clip_encode_text(payload: dto.TextModelRequest) -> list[float]:
    """
    CLIP text model endpoint. Uses an ONNX Runtime InferenceSession as the model backend.
    The model will be automatically loaded if it isn't already loaded.

    Args:
        payload: Request containing the text to process.

    Returns:
        embedding: The embedding produced from the model.
    """

    model: ort.InferenceSession = await get_cached_model(clip_model, "clip-text")  # type: ignore
    tokenizer: PreTrainedTokenizerBase = await get_cached_model(clip_model, "tokenizer")  # type: ignore

    tokens = tokenizer(payload.text, return_tensors="np")
    embeddings = model.run(
        input_feed={
            "input_ids": tokens.input_ids,
            "attention_mask": tokens.attention_mask,
        },
        output_names=["text_embeds"],
    )
    return embeddings[0].squeeze().tolist()


@app.post("/facial-recognition/detect-faces", response_model=dto.FacialRecognitionResponse, status_code=200)
async def facial_recognition(payload: dto.VisionModelRequest) -> dto.FacialRecognitionResponse:
    """
    CLIP text model endpoint. Uses an ONNX Runtime InferenceSession as the model backend.
    The model will be automatically loaded if it isn't already loaded.

    Args:
        payload: Request containing the path of the image to process.

    Returns:
        faces: The embedding produced from the model.
    """

    model: FaceAnalysis = await get_cached_model(face_model, "facial-recognition")  # type: ignore
    img = cv.imread(payload.image_path)
    height, width, _ = img.shape

    outputs = model.get(img)
    faces = []
    for output in outputs:
        if output.det_score < min_face_score:
            continue

        x1, y1, x2, y2 = output.bbox
        bounding_box = dto.BoundingBox(
            x1=round(x1),
            y1=round(y1),
            x2=round(x2),
            y2=round(y2)
        )

        # TODO this shouldn't need to return width and height
        face = dto.ImageFace(
            image_width=width,
            image_height=height,
            bounding_box=bounding_box,
            score=output.det_score.item(),
            embedding=output.normed_embedding.tolist()
        )
        faces.append(face)

    return faces


if __name__ == "__main__":
    host = os.getenv("MACHINE_LEARNING_HOST", "0.0.0.0")
    port = int(os.getenv("MACHINE_LEARNING_PORT", 3003))
    is_dev = os.getenv("NODE_ENV") == "development"

    uvicorn.run("main:app", host=host, port=port, reload=is_dev, workers=1, use_colors=True)
