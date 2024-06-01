from pathlib import Path
from typing import Any

import numpy as np
from insightface.model_zoo import RetinaFace
from numpy.typing import NDArray

from app.models.base import InferenceModel
from app.models.transforms import decode_cv2
from app.schemas import DetectedFaces, ModelSession, ModelTask, ModelType


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

    def _predict(self, inputs: NDArray[np.uint8] | bytes, **kwargs: Any) -> DetectedFaces:
        inputs = decode_cv2(inputs)

        bboxes, landmarks = self._detect(inputs)
        return DetectedFaces(bounding_boxes=bboxes[:, :4], scores=bboxes[:, 4], landmarks=landmarks)

    def _detect(self, inputs: NDArray[np.uint8] | bytes) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
        return self.det_model.detect(inputs)  # type: ignore

    def postprocess(self, faces: DetectedFaces) -> Any:
        scores: list[float] = faces.bounding_boxes[:, 4].tolist()
        bboxes_list: list[list[int]] = faces.bounding_boxes[:, :4].round().tolist()
        landmarks_list: list[list[float]] = faces.landmarks.tolist() if faces.landmarks is not None else []

        return [
            {"box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}, "score": score, "landmarks": face_landmarks}
            for (x1, y1, x2, y2), score, face_landmarks in zip(bboxes_list, scores, landmarks_list)
        ]

    def configure(self, **kwargs: Any) -> None:
        self.det_model.det_thresh = kwargs.pop("minScore", self.det_model.det_thresh)
