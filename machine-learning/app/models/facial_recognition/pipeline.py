from typing import Any
import cv2
import numpy as np
from numpy.typing import NDArray

from app.models.facial_recognition.detection import FaceDetector
from app.models.facial_recognition.recognition import FaceRecognizer
from app.schemas import RecognizedFace, is_ndarray


class FacialRecognitionPipeline:
    def __init__(self, det_model: FaceDetector, rec_model: FaceRecognizer) -> None:
        self.det_model = det_model
        self.rec_model = rec_model
        self.loaded = False

    def load(self) -> None:
        self.det_model.load()
        self.rec_model.load()
        self.loaded = True

    def predict(self, inputs: NDArray[np.uint8] | bytes, **kwargs: Any) -> list[RecognizedFace]:
        if isinstance(inputs, bytes):
            decoded_image = cv2.imdecode(np.frombuffer(inputs, np.uint8), cv2.IMREAD_COLOR)
        else:
            decoded_image = inputs
        assert is_ndarray(decoded_image, np.uint8)

        faces = self.det_model.predict(decoded_image, **kwargs)
        results: list[RecognizedFace] = self.rec_model.predict(decoded_image, faces=faces, **kwargs)
        return results
