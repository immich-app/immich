import torch
from insightface.app import FaceAnalysis
from pathlib import Path
import os

from transformers import pipeline, Pipeline
from sentence_transformers import SentenceTransformer
from typing import Any
import cv2 as cv

cache_folder = os.getenv("MACHINE_LEARNING_CACHE_FOLDER", "/cache")
device = "cuda" if torch.cuda.is_available() else "cpu"


def get_model(model_name: str, model_type: str, **model_kwargs):
    """
    Instantiates the specified model.

    Args:
        model_name: Name of model in the model hub used for the task.
        model_type: Model type or task, which determines which model zoo is used.
            `facial-recognition` uses Insightface, while all other models use the HF Model Hub.

            Options:
                `image-classification`, `clip`,`facial-recognition`, `tokenizer`, `processor`

    Returns:
        model: The requested model.
    """

    cache_dir = _get_cache_dir(model_name, model_type)
    match model_type:
        case "facial-recognition":
            model = _load_facial_recognition(
                model_name, cache_dir=cache_dir, **model_kwargs
            )
        case "clip":
            model = SentenceTransformer(
                model_name, cache_folder=cache_dir, **model_kwargs
            )
        case _:
            model = pipeline(
                model_type,
                model_name,
                model_kwargs={"cache_dir": cache_dir, **model_kwargs},
            )

    return model


def run_classification(
    model: Pipeline, image_path: str, min_score: float | None = None
):
    predictions: list[dict[str, Any]] = model(image_path)  # type: ignore
    result = {
        tag
        for pred in predictions
        for tag in pred["label"].split(", ")
        if min_score is None or pred["score"] >= min_score
    }

    return list(result)


def run_facial_recognition(
    model: FaceAnalysis, image_path: str
) -> list[dict[str, Any]]:
    img = cv.imread(image_path)
    height, width, _ = img.shape
    results = []
    faces = model.get(img)

    for face in faces:
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


def _load_facial_recognition(
    model_name: str,
    min_face_score: float | None = None,
    cache_dir: Path | str | None = None,
    **model_kwargs,
):
    if cache_dir is None:
        cache_dir = _get_cache_dir(model_name, "facial-recognition")
    if isinstance(cache_dir, Path):
        cache_dir = cache_dir.as_posix()
    if min_face_score is None:
        min_face_score = float(os.getenv("MACHINE_LEARNING_MIN_FACE_SCORE", 0.7))

    model = FaceAnalysis(
        name=model_name,
        root=cache_dir,
        allowed_modules=["detection", "recognition"],
        **model_kwargs,
    )
    model.prepare(ctx_id=0, det_thresh=min_face_score, det_size=(640, 640))
    return model


def _get_cache_dir(model_name: str, model_type: str) -> Path:
    return Path(cache_folder, device, model_type, model_name)
