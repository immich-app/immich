from pathlib import Path
from typing import Any

import cv2
from insightface.app import FaceAnalysis

from ..config import settings
from ..schemas import ModelType
from .base import InferenceModel


class FaceRecognizer(InferenceModel):
    _model_type = ModelType.FACIAL_RECOGNITION

    def __init__(
        self,
        model_name: str,
        min_score: float = settings.min_face_score,
        cache_dir: Path | None = None,
        **model_kwargs,
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
        height, width, _ = image.shape
        results = []
        faces = self.model.get(image)

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
