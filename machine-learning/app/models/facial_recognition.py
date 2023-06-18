from pathlib import Path

import cv2
from insightface.app import FaceAnalysis

from ..config import get_cache_dir, settings
from ..schemas import ModelType


class FaceRecognizer:
    def __init__(
        self,
        model_name: str,
        min_score: float | None = None,
        cache_dir: Path | None = None,
        **model_kwargs,
    ):
        if model_name is not None:
            self.model_name = model_name
        self.min_score = min_score if min_score is not None else settings.min_face_score
        if cache_dir is None:
            cache_dir = get_cache_dir(model_name, ModelType.FACIAL_RECOGNITION)
        model = FaceAnalysis(
            name=self.model_name,
            root=cache_dir.as_posix(),
            allowed_modules=["detection", "recognition"],
            **model_kwargs,
        )
        model.prepare(
            ctx_id=0,
            det_thresh=self.min_score,
            det_size=(640, 640),
        )
        self.model = model

    def recognize(self, image: cv2.Mat):
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
