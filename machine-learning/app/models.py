import torch
from insightface.app import FaceAnalysis
from pathlib import Path
import os

from transformers import pipeline, Pipeline
from sentence_transformers import SentenceTransformer
from typing import Any
import cv2 as cv
import numpy as np
from insightface.utils.face_align import norm_crop
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
    model: Pipeline, image_paths: str | list[str], min_score: float | None = None
) -> list[str] | list[list[str]]:

    batch_predictions = model(image_paths)  # type: ignore
    if (batched := isinstance(batch_predictions[0], dict)):
        batch_predictions = [batch_predictions]

    results = [
        list({
            tag
            for pred in predictions
            for tag in pred["label"].split(", ")
            if min_score is None or pred["score"] >= min_score
        })
        for predictions in batch_predictions
    ]

    return results[0] if not batched else results


def run_facial_recognition(
    model: FaceAnalysis, image_paths: str | list[str]
) -> list[dict[str, Any]] | list[list[dict[str, Any]]]:
    if not (batched := isinstance(image_paths, list)):
        images = [cv.imread(image_paths)]
    else:
        images = [cv.imread(image_path) for image_path in image_paths]

    batch_det = []
    face_counts = []
    batch_cropped_images = []
    for image in images:
        # detection model doesn't support batching, but recognition model does
        bboxes, kpss = model.det_model.detect(image)
        face_count = bboxes.shape[0]
        face_counts.append(face_count)
        if face_count == 0:
            continue

        batch_det.append(bboxes)
        for kps in kpss:
            batch_cropped_images.append(norm_crop(image, kps))
    if not batch_cropped_images:
        return [] if not batched else [[]] * len(image_paths)
    
    embeddings = model.models['recognition'].get_feat(batch_cropped_images).tolist()
    batch_det_np = np.stack(batch_det)
    batch_bboxes = batch_det_np[:, :4].round().tolist()
    det_scores = batch_det_np[:, 4].tolist()

    results = []
    images_with_faces = [image for i, image in enumerate(images) for _ in range(face_counts[i])]
    for i, image in enumerate(images_with_faces):
        height, width, _ = image.shape
        image_faces = []
        for j in face_counts[i]:
            embedding = embeddings[i][j]
            x1, y1, x2, y2 = batch_bboxes[i][j]
            det_score = det_scores[i][j]
            face = {
                "imageWidth": width,
                "imageHeight": height,
                "boundingBox": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                },
                "score": det_score,
                "embedding": embedding,
            }
            image_faces.append(face)
        results.append(image_faces)

    return results[0] if not batched else results


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
