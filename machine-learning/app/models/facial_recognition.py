from pathlib import Path
from typing import Any
import zipfile

import cv2
from insightface.app import FaceAnalysis

from ..config import settings
from ..schemas import ModelType
from .base import InferenceModel
from insightface.utils.storage import BASE_REPO_URL, download_file


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

    def download(self, **model_kwargs: Any):
        if self.cache_dir.is_dir() and any(self.cache_dir.glob("*.onnx")):
            return
        download_file(f"{BASE_REPO_URL}/{self.model_name}.zip", self.cache_dir.as_posix())
        zip_file = self.cache_dir / f"{self.model_name}.zip"
        with zipfile.ZipFile(zip_file, "r") as zip:
            recognition_model = "1k3d68.onnx"
            detection_model = next(model for model in zip.namelist() if model.startswith("det_"))
            zip.extractall(self.cache_dir, members=[recognition_model, detection_model])
        zip_file.unlink()

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
