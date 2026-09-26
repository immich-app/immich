from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from immich_ml.config import settings
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_pil, normalize, serialize_np_array
from immich_ml.schemas import FaceDetectionOutput, FacialRecognitionOutput, ModelTask, ModelType, Shape
from immich_ml.sessions.policy import ShapePolicy, batches, runs

from ._ops import ALIGNED_SIZE, align_face


class FaceRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)]
    identity = (ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        super().__init__(model_name, **model_kwargs)
        sizes = batches(settings.max_batch_size.facial_recognition)
        self.shape_policy = ShapePolicy(dims=tuple(Shape(batch) for batch in sizes))

    def _predict(
        self, inputs: NDArray[np.uint8] | bytes | Image.Image, faces: FaceDetectionOutput
    ) -> FacialRecognitionOutput:
        if faces["boxes"].shape[0] == 0:
            return []
        image = np.asarray(decode_pil(inputs), dtype=np.uint8)
        landmarks = faces["landmarks"]
        sizes = runs(len(landmarks), self.session.batches)
        crops: NDArray[np.float32] | NDArray[np.uint8] = np.empty(
            (len(landmarks), ALIGNED_SIZE, ALIGNED_SIZE, 3), dtype=np.uint8
        )
        for crop, kps in zip(crops, landmarks):
            align_face(image, kps, crop)
        if not self.session.for_shape(Shape(sizes[0])).normalizes_input:
            crops = normalize(crops.transpose(0, 3, 1, 2).astype(np.float32, order="C"), mean=127.5, std=127.5)
        embeddings = self._predict_batch(crops, sizes)
        return self.postprocess(faces, embeddings)

    def _predict_batch(self, crops: NDArray[np.float32] | NDArray[np.uint8], sizes: list[int]) -> NDArray[np.float32]:
        embeddings = []
        start = 0
        for size in sizes:
            session = self.session.for_shape(Shape(size))
            embeddings.append(session.run(None, {session.get_inputs()[0].name: crops[start : start + size]})[0])
            start += size
        return embeddings[0] if len(embeddings) == 1 else np.concatenate(embeddings, axis=0)

    def postprocess(self, faces: FaceDetectionOutput, embeddings: NDArray[np.float32]) -> FacialRecognitionOutput:
        return [
            {
                "boundingBox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "embedding": serialize_np_array(embedding),
                "score": score,
            }
            for (x1, y1, x2, y2), embedding, score in zip(faces["boxes"], embeddings, faces["scores"])
        ]
