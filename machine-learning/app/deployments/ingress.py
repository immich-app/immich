from io import BytesIO
from typing import Any

import cv2
import numpy as np
from fastapi import Body, Depends, FastAPI, HTTPException
from PIL import Image, UnidentifiedImageError
from ray import serve

from ..config import settings
from ..schemas import (
    EmbeddingResponse,
    FaceResponse,
    MessageResponse,
    TagResponse,
    TextModelRequest,
    TextResponse,
)


async def load_pil_image(byte_image: bytes = Body(...)) -> Image.Image:
    try:
        image = Image.open(BytesIO(byte_image))
    except UnidentifiedImageError:
        raise HTTPException(415, "Unable to load image.")

    return image


async def load_cv_image(byte_image: bytes = Body(...)) -> cv2.Mat:
    image = cv2.imdecode(np.frombuffer(byte_image, np.uint8), cv2.IMREAD_COLOR)
    if image is None:  # cv2.imread silently returns None on failure
        raise HTTPException(415, "Unable to load image.")

    return image


app = FastAPI()


# lots of `type: ignores` below; it seems `serve` doesn't play well with mypy
@serve.deployment(route_prefix="/", ray_actor_options={"num_cpus": 0})
@serve.ingress(app)
class ModelIngress:
    """
    App deployment with FastAPI integration.
    Individual requests are batched together for more efficient model inference.
    Unlike `ModelHandler`, this deployment does not autoscale; it will always have one replica.
    """

    def __init__(self, handler: Any) -> None:
        self.handler = handler

    @app.get("/", response_model=MessageResponse)
    async def root(self) -> dict[str, str]:
        return {"message": "Immich ML"}

    @app.get("/ping", response_model=TextResponse)
    def ping(self) -> str:
        return "pong"

    @app.post("/image-classifier/tag-image", response_model=TagResponse, status_code=200)
    async def classify(self, image: Image.Image = Depends(load_pil_image)) -> list[list[str]]:
        return await self.classify_batch(image)  # type: ignore

    @app.post(
        "/sentence-transformer/encode-image",
        response_model=EmbeddingResponse,
        status_code=200,
    )
    async def clip_encode_image(self, image: Image.Image = Depends(load_pil_image)) -> list[list[float]]:
        return await self.clip_encode_image_batch(image)  # type: ignore

    @app.post(
        "/sentence-transformer/encode-text",
        response_model=EmbeddingResponse,
        status_code=200,
    )
    async def clip_encode_text(self, payload: TextModelRequest) -> list[list[float]]:
        return await self.clip_encode_text_batch(payload.text)  # type: ignore

    @app.post("/facial-recognition/detect-faces", response_model=FaceResponse, status_code=200)
    async def facial_recognition(self, image: cv2.Mat = Depends(load_cv_image)) -> list[dict[str, Any]]:
        return await self.facial_recognition_batch(image)  # type: ignore

    @serve.batch(max_batch_size=settings.max_batch_size, batch_wait_timeout_s=settings.batch_timeout_s)  # type: ignore
    async def classify_batch(self, images: list[Image.Image]) -> list[list[str]]:
        batch_labels = await self.handler.classify.remote(images)
        return await batch_labels

    @serve.batch(max_batch_size=settings.max_batch_size, batch_wait_timeout_s=settings.batch_timeout_s)  # type: ignore
    async def clip_encode_image_batch(self, images: list[Image.Image]) -> list[list[float]]:
        embeddings = await self.handler.encode_image.remote(images)
        return await embeddings

    @serve.batch(max_batch_size=settings.max_batch_size, batch_wait_timeout_s=settings.batch_timeout_s)  # type: ignore
    async def clip_encode_text_batch(self, texts: list[Image.Image]) -> list[list[float]]:
        embeddings = await self.handler.encode_text.remote(texts)
        return await embeddings

    @serve.batch(max_batch_size=settings.max_batch_size, batch_wait_timeout_s=settings.batch_timeout_s)  # type: ignore
    async def facial_recognition_batch(self, images: list[cv2.Mat]) -> list[dict[str, Any]]:
        batch_faces = await self.handler.recognize.remote(images)
        return await batch_faces
