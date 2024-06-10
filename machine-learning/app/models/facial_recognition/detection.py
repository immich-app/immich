from typing import Any

import numpy as np
import onnxruntime as ort
from numpy.typing import NDArray

from app.models.base import InferenceModel
from app.models.session import ort_has_batch_dim, ort_expand_outputs
from app.models.transforms import decode_pil
from app.schemas import FaceDetectionOutput, ModelSession, ModelTask, ModelType
from .scrfd import SCRFD
from PIL import Image
from PIL.ImageOps import pad

class FaceDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        if isinstance(session, ort.InferenceSession) and not ort_has_batch_dim(session):
            ort_expand_outputs(session)
        self.model = SCRFD(session=session)

        return session

    def _predict(self, inputs: NDArray[np.uint8] | bytes | Image.Image, **kwargs: Any) -> FaceDetectionOutput:
        inputs = self._transform(inputs)

        [bboxes], [landmarks] = self.model.detect(inputs, threshold=kwargs.pop("minScore", 0.7))
        return {
            "boxes": bboxes[:, :4].round(),
            "scores": bboxes[:, 4],
            "landmarks": landmarks,
        }

    def _detect(self, inputs: NDArray[np.uint8] | bytes) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
        return self.model.detect(inputs)  # type: ignore

    def _transform(self, inputs: NDArray[np.uint8] | bytes | Image.Image) -> NDArray[np.uint8]:
        image = decode_pil(inputs)
        padded = pad(image, (640, 640), method=Image.Resampling.BICUBIC)
        return np.array(padded, dtype=np.uint8)[None, ...]
