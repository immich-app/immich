from pathlib import Path
from typing import Any

import cv2
import numpy as np
from insightface.app import FaceAnalysis
from insightface.utils.face_align import norm_crop

from ..config import settings
from ..schemas import ModelType, ndarray
from .base import InferenceModel


class FaceRecognizer(InferenceModel):
    _model_type = ModelType.FACIAL_RECOGNITION

    def __init__(
        self,
        model_name: str,
        min_score: float = settings.min_face_score,
        cache_dir: Path | str | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.min_score = min_score
        super().__init__(model_name, cache_dir, **model_kwargs)

    def load(self, **model_kwargs: Any) -> None:
        self.model = FaceAnalysis(
            name=self.model_name,
            root=self.cache_dir.as_posix(),
            allowed_modules=["detection", "recognition"],
            **model_kwargs,
        )
        self.model.prepare(
            ctx_id=0,
            det_thresh=self.min_score,
            det_size=(640, 640),
        )

    def predict(self, image: cv2.Mat) -> list[dict[str, Any]]:
        return self.predict_batch([image])[0]

    def predict_batch(self, images: list[cv2.Mat]) -> list[list[dict[str, Any]]]:
        batch_det, batch_kpss = self._detect(images)
        batch_cropped_images, batch_offsets = self._preprocess(images, batch_kpss)
        if batch_cropped_images:
            batch_embeddings = self._recognize(batch_cropped_images)
            results = self._postprocess(
                images, batch_det, batch_embeddings, batch_offsets
            )
        else:
            results = self._postprocess(images, batch_det)
        return results

    def _detect(self, images: list[cv2.Mat]) -> tuple[list[ndarray], ...]:
        batch_det: list[ndarray] = []
        batch_kpss: list[ndarray] = []
        for image in images:
            # detection model doesn't support batching, but recognition model does
            bboxes, kpss = self.model.det_model.detect(image)
            batch_det.append(bboxes)
            batch_kpss.append(kpss)
        return batch_det, batch_kpss

    def _preprocess(
        self, images: list[cv2.Mat], batch_kpss: list[ndarray]
    ) -> tuple[list[cv2.Mat], list[int]]:
        batch_cropped_images = []
        batch_offsets = []
        total_faces = 0
        for i, image in enumerate(images):
            kpss = batch_kpss[i]
            total_faces += kpss.shape[0]
            batch_offsets.append(total_faces)
            for kps in kpss:
                batch_cropped_images.append(norm_crop(image, kps))
        return batch_cropped_images, batch_offsets

    def _recognize(self, images: list[cv2.Mat]) -> np.ndarray:
        embeddings = self.model.models["recognition"].get_feat(images)
        return embeddings

    def _postprocess(
        self,
        images: list[cv2.Mat],
        batch_det: list[ndarray],
        batch_embeddings: ndarray | None = None,
        batch_offsets: list[int] | None = None,
    ) -> list[list[dict[str, Any]]]:
        if batch_embeddings is not None and batch_offsets is not None:
            image_embeddings = np.array_split(batch_embeddings, batch_offsets)
        else:
            image_embeddings = None

        batch_faces: list[list[dict[str, Any]]] = []
        for i, image in enumerate(images):
            faces: list[dict[str, Any]] = []
            batch_faces.append(faces)
            if image_embeddings is None or image_embeddings[i].shape[0] == 0:
                continue

            height, width, _ = image.shape

            embeddings = image_embeddings[i].tolist()
            bboxes = batch_det[i][:, :4].round().tolist()
            det_scores = batch_det[i][:, 4].tolist()
            for embedding, bbox, det_score in zip(embeddings, bboxes, det_scores):
                x1, y1, x2, y2 = bbox
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

                faces.append(face)
        return batch_faces
