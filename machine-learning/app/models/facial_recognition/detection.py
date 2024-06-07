from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
from insightface.model_zoo import RetinaFace
from numpy.typing import NDArray

from app.models.base import InferenceModel
from app.models.transforms import decode_cv2
from app.schemas import FaceDetectionOutput, ModelSession, ModelTask, ModelType


class FaceDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)

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
        self._squeeze_outputs(session)
        self.model = RetinaFace(session=session)
        self.model.prepare(ctx_id=0, det_thresh=self.min_score, input_size=(640, 640))

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

    def _squeeze_outputs(self, session: ort.InferenceSession) -> None:
        original_run = session.run

        def run(output_names: list[str], input_feed: dict[str, NDArray[np.float32]]) -> list[NDArray[np.float32]]:
            out: list[NDArray[np.float32]] = original_run(output_names, input_feed)
            out = [o.squeeze(axis=0) for o in out]
            return out

        session.run = run

    def configure(self, **kwargs: Any) -> None:
        self.model.det_thresh = kwargs.pop("minScore", self.model.det_thresh)
