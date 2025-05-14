from typing import Any

import numpy as np
from insightface.model_zoo import RetinaFace
from numpy.typing import NDArray

from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2
from immich_ml.schemas import FaceDetectionOutput, ModelSession, ModelTask, ModelType


class FaceDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)

    def __init__(self, model_name: str, min_score: float = 0.7, **model_kwargs: Any) -> None:
        self.min_score = model_kwargs.pop("minScore", min_score)
        super().__init__(model_name, **model_kwargs)

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        self.model = RetinaFace(session=session)
        self.model.prepare(ctx_id=0, det_thresh=self.min_score, input_size=(256, 256))

        return session

    def _predict(self, inputs: NDArray[np.uint8] | bytes, **kwargs: Any) -> FaceDetectionOutput:
        inputs = decode_cv2(inputs)

        bboxes, landmarks = self._detect(inputs)
        return {
            "boxes": bboxes[:, :4].round(),
            "scores": bboxes[:, 4],
            "landmarks": landmarks,
        }

    def _detect(self, inputs: NDArray[np.uint8] | bytes) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
        return self.model.detect(inputs)  # type: ignore

    def configure(self, **kwargs: Any) -> None:
        self.model.det_thresh = kwargs.pop("minScore", self.model.det_thresh)
