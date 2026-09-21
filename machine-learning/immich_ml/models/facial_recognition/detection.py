import numpy as np
from immich_model.constants import FACE_DETECTION_SIZE as DET_SIZE
from numpy.typing import NDArray

from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_pil, letterbox, normalize
from immich_ml.schemas import FaceDetectionOutput, ModelTask, ModelType, Shape
from immich_ml.sessions.policy import ShapePolicy

from ._ops import decode_scrfd, nms


class FaceDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)
    shape_policy = ShapePolicy(dims=(Shape(batch=1, height=DET_SIZE, width=DET_SIZE),))

    def _predict(self, inputs: NDArray[np.uint8] | bytes, minScore: float) -> FaceDetectionOutput:
        session = self.session.for_shape(self.shape_policy.dims[0])
        canvas, scale = letterbox(decode_pil(inputs), DET_SIZE)
        blob: NDArray[np.float32] | NDArray[np.uint8] = (
            canvas[None]
            if session.normalizes_input
            else normalize(canvas.astype(np.float32), 127.5, 128).transpose(2, 0, 1)[None]
        )

        heads = session.run(None, {session.get_inputs()[0].name: blob})
        scores, boxes, kps = decode_scrfd(heads, DET_SIZE)

        candidates = scores >= minScore
        scores, boxes, kps = scores[candidates], boxes[candidates] / scale, kps[candidates] / scale
        keep = nms(boxes, scores)

        return {
            "boxes": boxes[keep].round(),
            "scores": scores[keep],
            "landmarks": kps[keep].reshape(-1, 5, 2),
        }
