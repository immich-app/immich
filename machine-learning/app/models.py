from schemas import ModelType
import torch
from insightface.app import FaceAnalysis
from pathlib import Path
import os

from transformers import pipeline, Pipeline
from sentence_transformers import SentenceTransformer
from typing import Any
import cv2 as cv
from PIL.Image import Image
import numpy as np
from insightface.utils.face_align import norm_crop
cache_folder = os.getenv("MACHINE_LEARNING_CACHE_FOLDER", "/cache")
device = "cuda" if torch.cuda.is_available() else "cpu"


def get_model(model_name: str, model_type: ModelType, **model_kwargs):
    """
    Instantiates the specified model.

    Args:
        model_name: Name of model in the model hub used for the task.
        model_type: Model type or task, which determines which model zoo is used.
            `facial-recognition` uses Insightface, while all other models use the HF Model Hub.

    Returns:
        model: The requested model.
    """

    cache_dir = _get_cache_dir(model_name, model_type)
    match model_type:
        case ModelType.FACIAL_RECOGNITION:
            model = _load_facial_recognition(
                model_name, cache_dir=cache_dir, **model_kwargs
            )
        case ModelType.CLIP:
            model = SentenceTransformer(
                model_name, cache_folder=cache_dir.as_posix(), **model_kwargs
            )
        case _:
            model = pipeline(
                model_type,
                model_name,
                model_kwargs={"cache_dir": cache_dir, **model_kwargs},
            )

    return model


def run_classification(
    model: Pipeline, images: list[Image], min_score: float | None = None
) -> list[list[str]]:

    batch_predictions: list[list[dict[str, Any]]] = model(images)  # type: ignore
    results = [
        list({
            tag
            for pred in predictions
            for tag in pred["label"].split(", ")
            if min_score is None or pred["score"] >= min_score
        })
        for predictions in batch_predictions
    ]

    return results


def run_facial_recognition(model: FaceAnalysis, images: list[cv.Mat]) -> list[dict[str, Any]]:
    batch_det: list[np.ndarray[int, np.dtype[np.float32]]] = []
    image_offsets: list[int] = []
    batch_cropped_images: list[cv.Mat] = []
    results: list[dict[str, Any]] = []

    total_faces = 0
    for image in images:
        # detection model doesn't support batching, but recognition model does
        bboxes, kpss = model.det_model.detect(image)
        face_count = bboxes.shape[0]
        total_faces += face_count
        image_offsets.append(total_faces)
        height, width, _ = image.shape
        image_faces = {
            "imageWidth": width,
            "imageHeight": height,
            "faces": []
        }
        results.append(image_faces)
        batch_det.append(bboxes)
        for kps in kpss:
            batch_cropped_images.append(norm_crop(image, kps))

    if not batch_cropped_images:
        return results

    embeddings = model.models['recognition'].get_feat(batch_cropped_images)
    image_embeddings = np.array_split(embeddings, image_offsets)

    for i, image_faces in enumerate(results):
        if image_embeddings[i].shape[0] == 0:
            continue

        embeddings = image_embeddings[i].tolist()
        bboxes = batch_det[i][:, :4].round().tolist()
        det_scores = batch_det[i][:, 4].tolist()
        for embedding, bbox, det_score in zip(embeddings, bboxes, det_scores):
            x1, y1, x2, y2 = bbox
            face = {
                "boundingBox": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                },
                "score": det_score,
                "embedding": embedding,
            }

            image_faces["faces"].append(face)
    return results


def _load_facial_recognition(
    model_name: str,
    min_face_score: float | None = None,
    cache_dir: Path | str | None = None,
    **model_kwargs,
):
    if cache_dir is None:
        cache_dir = _get_cache_dir(model_name, ModelType.FACIAL_RECOGNITION)
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


def _get_cache_dir(model_name: str, model_type: ModelType) -> Path:
    return Path(cache_folder) / device / model_type / model_name
