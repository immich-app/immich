from functools import partial
from pathlib import Path
from typing import Any
import zipfile

import cv2
from insightface.model_zoo import ArcFaceONNX, RetinaFace
import numpy as np

from ..config import settings
from ..schemas import ModelType
from .base import InferenceModel
from insightface.utils.storage import BASE_REPO_URL, download_file
from insightface.utils.face_align import norm_crop


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

    def download(self, **model_kwargs: Any) -> None:
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
        det_file = next(self.cache_dir.glob("det_*.onnx")).as_posix()
        rec_file = next(self.cache_dir.glob("w600k_*.onnx")).as_posix()
        self.det_model = RetinaFace(det_file)
        self.rec_model = ArcFaceONNX(rec_file)

        self.det_model.prepare(
            ctx_id=-1,
            det_thresh=self.min_score,
            input_size=(640, 640),
        )
        self.rec_model.prepare(ctx_id=-1)

    def predict(self, image: cv2.Mat) -> list[dict[str, Any]]:
        height, width, _ = image.shape
        results = []
        bboxes, kpss = self.det_model.detect(image)
        if not kpss:
            return []
        cropped_imgs = [norm_crop(image, kps) for kps in kpss]
        embeddings = self.rec_model.get_feat(cropped_imgs).tolist()
        scores = bboxes[:, 4].tolist()
        bboxes = bboxes[:, :4].round().tolist()

        for (x1, y1, x2, y2), score, embedding in zip(bboxes, scores, embeddings):
            results.append(
                {
                    "imageWidth": width,
                    "imageHeight": height,
                    "boundingBox": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                    },
                    "score": score,
                    "embedding": embedding,
                }
            )
        return results
