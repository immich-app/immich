from pathlib import Path
from typing import Any

import cv2
import numpy as np
from insightface.model_zoo import ArcFaceONNX, RetinaFace
from insightface.utils.face_align import norm_crop
from numpy.typing import NDArray

from app.config import clean_name
from app.schemas import Face, ModelType, is_ndarray

from .base import InferenceModel


class FaceRecognizer(InferenceModel):
    _model_type = ModelType.FACIAL_RECOGNITION

    def __init__(
        self,
        model_name: str,
        min_score: float = 0.7,
        cache_dir: Path | str | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.min_score = model_kwargs.pop("minScore", min_score)
        super().__init__(clean_name(model_name), cache_dir, **model_kwargs)

    def _load(self) -> None:
        self.det_model = RetinaFace(session=self._make_session(self.det_file))
        self.rec_model = ArcFaceONNX(
            self.rec_file.with_suffix(".onnx").as_posix(),
            session=self._make_session(self.rec_file),
        )

        self.det_model.prepare(
            ctx_id=0,
            det_thresh=self.min_score,
            input_size=(640, 640),
        )
        self.rec_model.prepare(ctx_id=0)

    def _predict(self, image: NDArray[np.uint8] | bytes) -> list[Face]:
        if isinstance(image, bytes):
            decoded_image = cv2.imdecode(np.frombuffer(image, np.uint8), cv2.IMREAD_COLOR)
        else:
            decoded_image = image
        assert is_ndarray(decoded_image, np.uint8)
        bboxes, kpss = self.det_model.detect(decoded_image)
        if bboxes.size == 0:
            return []
        assert is_ndarray(kpss, np.float32)

        scores = bboxes[:, 4].tolist()
        bboxes = bboxes[:, :4].round().tolist()

        results = []
        height, width, _ = decoded_image.shape
        for (x1, y1, x2, y2), score, kps in zip(bboxes, scores, kpss):
            cropped_img = norm_crop(decoded_image, kps)
            embedding: NDArray[np.float32] = self.rec_model.get_feat(cropped_img)[0]
            face: Face = {
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
            results.append(face)
        return results

    @property
    def cached(self) -> bool:
        return self.det_file.is_file() and self.rec_file.is_file()

    @property
    def det_file(self) -> Path:
        return self.cache_dir / "detection" / f"model.{self.preferred_runtime}"

    @property
    def rec_file(self) -> Path:
        return self.cache_dir / "recognition" / f"model.{self.preferred_runtime}"

    def configure(self, **model_kwargs: Any) -> None:
        self.det_model.det_thresh = model_kwargs.pop("minScore", self.det_model.det_thresh)
