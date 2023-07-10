from typing import Any

import cv2
from PIL import Image
from ray import serve

from ..config import settings
from ..models import (
    CLIPSTEncoder,
    FaceRecognizer,
    ImageClassifier,
)


@serve.deployment(autoscaling_config=settings.autoscaling)
class ModelHandler:
    """
    Helper deployment to load all models in the same process.
    Runs in a threadpool, so it can handle concurrent requests more effectively than `AsyncModelHandler`.

    As a deployment, it should not be instantiated directly, but instead invoked with `ModelHandler.bind`,
    passing the __init__ args to this call.

    Note that once models are loaded, they will stay in memory until *all* models idle for the
    model TTL duration set in `autoscaling_config`, at which point the entire process will be terminated.
    """

    __slots__ = ("classifier", "clip_image_encoder", "clip_text_encoder", "face_recognizer")

    def __init__(
        self,
        classification_model: str = settings.classification_model,
        clip_image_model: str = settings.clip_image_model,
        clip_text_model: str = settings.clip_text_model,
        facial_recognition_model: str = settings.facial_recognition_model,
    ) -> None:
        self.classifier = ImageClassifier(classification_model)
        self.clip_image_encoder = CLIPSTEncoder(clip_image_model)
        self.clip_text_encoder = (
            CLIPSTEncoder(clip_text_model) if clip_image_model != clip_text_model else self.clip_image_encoder
        )
        self.face_recognizer = FaceRecognizer(facial_recognition_model)

    def classify(self, images: list[Image.Image]) -> list[list[str]]:
        return self.classifier.predict_batch(images)

    def encode_image(self, images: list[Image.Image]) -> list[list[float]]:
        return self.clip_image_encoder.predict_batch(images)

    def encode_text(self, texts: list[str]) -> list[list[float]]:
        return self.clip_text_encoder.predict_batch(texts)

    def recognize(self, images: list[cv2.Mat]) -> list[list[dict[str, Any]]]:
        return self.face_recognizer.predict_batch(images)
