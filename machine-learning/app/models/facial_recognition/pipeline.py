from typing import Any

import numpy as np
from numpy.typing import NDArray

from app.models.facial_recognition.detection import FaceDetector
from app.models.facial_recognition.recognition import FaceRecognizer
from app.models.transforms import decode_cv2
from app.schemas import DetectedFaces, FacialRecognitionResponse


class FacialRecognitionPipeline:
    def __init__(self, det_model: FaceDetector, rec_model: FaceRecognizer) -> None:
        self.det_model = det_model
        self.rec_model = rec_model
        self.loaded = False

    def load(self) -> None:
        self.det_model.load()
        self.rec_model.load()
        self.loaded = True

    def predict(self, inputs: NDArray[np.uint8] | bytes, **kwargs: Any) -> FacialRecognitionResponse:
        inputs = decode_cv2(inputs)

        detected_faces: DetectedFaces = self.det_model.predict(inputs, **kwargs)
        embeddings: NDArray[np.float32] = self.rec_model.predict(inputs, faces=detected_faces, **kwargs)
        return self.postprocess(inputs, detected_faces, embeddings)

    def postprocess(
        self, image: NDArray[np.uint8], faces: DetectedFaces, embeddings: NDArray[np.float32]
    ) -> FacialRecognitionResponse:
        height, width, _ = image.shape
        return {
            "imageHeight": height,
            "imageWidth": width,
            "faces": [
                {
                    "boundingBox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "embedding": embedding,
                    "score": score,
                }
                for (x1, y1, x2, y2), embedding, score in zip(faces.bounding_boxes, embeddings, faces.scores)
            ],
        }
