import zipfile
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import onnxruntime as ort
from insightface.model_zoo import ArcFaceONNX, RetinaFace
from insightface.utils.face_align import norm_crop
from insightface.utils.storage import BASE_REPO_URL, download_file

from ..config import settings
from ..schemas import ModelType
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

    def _download(self, **model_kwargs: Any) -> None:
        zip_file = self.cache_dir / f"{self.model_name}.zip"
        download_file(f"{BASE_REPO_URL}/{self.model_name}.zip", zip_file)
        with zipfile.ZipFile(zip_file, "r") as zip:
            members = zip.namelist()
            det_file = next(model for model in members if model.startswith("det_"))
            rec_file = next(model for model in members if model.startswith("w600k_"))
            zip.extractall(self.cache_dir, members=[det_file, rec_file])
        zip_file.unlink()

    def _load(self, **model_kwargs: Any) -> None:
        try:
            det_file = next(self.cache_dir.glob("det_*.onnx"))
            rec_file = next(self.cache_dir.glob("w600k_*.onnx"))
        except StopIteration:
            raise FileNotFoundError("Facial recognition models not found in cache directory")

        self.det_model = RetinaFace(
            session=ort.InferenceSession(
                det_file.as_posix(),
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            ),
        )
        self.rec_model = ArcFaceONNX(
            rec_file.as_posix(),
            session=ort.InferenceSession(
                rec_file.as_posix(),
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            ),
        )

        self.det_model.prepare(
            ctx_id=0,
            det_thresh=self.min_score,
            input_size=(640, 640),
        )
        self.rec_model.prepare(ctx_id=0)

    def _predict(self, image: cv2.Mat) -> list[dict[str, Any]]:
        bboxes, kpss = self.det_model.detect(image)
        if bboxes.size == 0:
            return []
        assert isinstance(kpss, np.ndarray)

        scores = bboxes[:, 4].tolist()
        bboxes = bboxes[:, :4].round().tolist()

        results = []
        height, width, _ = image.shape
        for (x1, y1, x2, y2), score, kps in zip(bboxes, scores, kpss):
            cropped_img = norm_crop(image, kps)
            embedding = self.rec_model.get_feat(cropped_img)[0].tolist()
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

    @property
    def cached(self) -> bool:
        return self.cache_dir.is_dir() and any(self.cache_dir.glob("*.onnx"))
