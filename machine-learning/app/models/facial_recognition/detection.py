from pathlib import Path
from typing import Any

import cv2
import numpy as np
from insightface.model_zoo import RetinaFace
from numpy.typing import NDArray

from app.schemas import DetectedFace, ModelSession, ModelTask, ModelType, is_ndarray

from app.models.base import InferenceModel


class FaceDetector(InferenceModel):
    _model_task = ModelTask.FACIAL_RECOGNITION
    _model_type = ModelType.DETECTION

    def __init__(
        self,
        model_name: str,
        min_score: float = 0.7,
        cache_dir: Path | str | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.min_score = model_kwargs.pop("minScore", min_score)
        super().__init__(model_name, cache_dir, **model_kwargs)

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        self.det_model = RetinaFace(session=session)
        self.det_model.prepare(ctx_id=0, det_thresh=self.min_score, input_size=(640, 640))

        return session

    def _predict(self, inputs: NDArray[np.uint8] | bytes, **kwargs: Any) -> list[DetectedFace]:
        if isinstance(inputs, bytes):
            decoded_image = cv2.imdecode(np.frombuffer(inputs, np.uint8), cv2.IMREAD_COLOR)
        else:
            decoded_image = inputs
        assert is_ndarray(decoded_image, np.uint8)

        bboxes, landmarks = self.det_model.detect(decoded_image)
        assert is_ndarray(bboxes, np.float32)
        assert is_ndarray(landmarks, np.float32)

        if bboxes.size == 0:
            return []

        scores: list[float] = bboxes[:, 4].tolist()
        bboxes_list: list[list[int]] = bboxes[:, :4].round().tolist()

        results: list[DetectedFace] = [
            {"box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}, "score": score, "landmarks": face_landmarks}
            for (x1, y1, x2, y2), score, face_landmarks in zip(bboxes_list, scores, landmarks)
        ]

        return results

    def configure(self, **kwargs: Any) -> None:
        self.det_model.det_thresh = kwargs.pop("minScore", self.det_model.det_thresh)
