import numpy as np
from numpy.typing import NDArray

from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_pil, letterbox, normalize
from immich_ml.schemas import FaceDetectionOutput, ModelTask, ModelType

from ._ops import DET_SIZE, decode_scrfd, nms


class FaceDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)

    def _predict(self, inputs: NDArray[np.uint8] | bytes, minScore: float) -> FaceDetectionOutput:
        canvas, scale = letterbox(decode_pil(inputs), DET_SIZE)
        blob = normalize(canvas.astype(np.float32), mean=127.5, std=128).transpose(2, 0, 1)[None]

        input_name = self.session.get_inputs()[0].name
        heads = self.session.run(None, {input_name: blob})
        scores, boxes, kps = decode_scrfd(heads, DET_SIZE)

        candidates = scores >= minScore
        scores, boxes, kps = scores[candidates], boxes[candidates] / scale, kps[candidates] / scale
        keep = nms(boxes, scores)

        return {
            "boxes": boxes[keep].round(),
            "scores": scores[keep],
            "landmarks": kps[keep].reshape(-1, 5, 2),
        }
