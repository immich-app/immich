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
from ..models.cache import ModelCache
from ..schemas import ModelType


@serve.deployment(
    autoscaling_config=settings.autoscaling,
    ray_actor_options={"num_cpus": settings.num_cpus, "memory": 2 ^ 31},
)
class ModelHandler:
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

    def recognize(self, images: list[cv2.Mat]) -> list[dict[str, Any]]:
        return self.face_recognizer.predict_batch(images)


# this version has stricter model TTL enforcement and built-in batching
# but it's somewhat slower than `ModelHandler` since inference is blocking
@serve.deployment(
    autoscaling_config=settings.autoscaling,
    ray_actor_options={"num_cpus": settings.num_cpus, "memory": 2 ^ 31},
)
class AsyncModelHandler:
    def __init__(
        self,
        classification_model,
        clip_image_model,
        clip_text_model,
        facial_recognition_model,
    ) -> None:
        self.model_cache = ModelCache(ttl=settings.model_ttl, revalidate=True)
        self.classification_model = classification_model
        self.clip_image_model = clip_image_model
        self.clip_text_model = clip_text_model
        self.facial_recognition_model = facial_recognition_model

    @serve.batch(  # type: ignore
        max_batch_size=settings.max_batch_size,
        batch_wait_timeout_s=settings.batch_timeout_s,
    )
    async def classify(self, images: list[Image.Image]) -> list[list[str]]:
        classifier = await self.model_cache.get(self.classification_model, ModelType.IMAGE_CLASSIFICATION)
        return classifier.predict_batch(images)

    @serve.batch(  # type: ignore
        max_batch_size=settings.max_batch_size,
        batch_wait_timeout_s=settings.batch_timeout_s,
    )
    async def encode_image(self, images: list[Image.Image]) -> list[list[float]]:
        clip_encoder = await self.model_cache.get(
            self.clip_image_model,
            ModelType.CLIP,
        )
        return clip_encoder.predict_batch(images)

    @serve.batch(  # type: ignore
        max_batch_size=settings.max_batch_size,
        batch_wait_timeout_s=settings.batch_timeout_s,
    )
    async def encode_text(self, texts: list[str]) -> list[list[float]]:
        clip_encoder = await self.model_cache.get(
            self.clip_text_model,
            ModelType.CLIP,
        )
        return clip_encoder.predict_batch(texts)

    @serve.batch(  # type: ignore
        max_batch_size=settings.max_batch_size,
        batch_wait_timeout_s=settings.batch_timeout_s,
    )
    async def recognize(self, images: list[cv2.Mat]) -> list[dict[str, Any]]:
        face_recognizer = await self.model_cache.get(self.facial_recognition_model, ModelType.FACIAL_RECOGNITION)
        return face_recognizer.predict_batch(images)
