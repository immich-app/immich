from pathlib import Path

import numpy as np
from PIL.Image import Image
from sentence_transformers import SentenceTransformer

from ..config import get_cache_dir
from ..schemas import ModelType


class CLIPSTEncoder:
    def __init__(
        self,
        vision_model_name: str,
        text_model_name: str | None = None,
        cache_dir: Path | None = None,
        **model_kwargs,
    ):
        self.vision_model_name = vision_model_name
        self.text_model_name = (
            text_model_name if text_model_name is not None else self.vision_model_name
        )
        if cache_dir is None:
            cache_dir = get_cache_dir(vision_model_name, ModelType.CLIP)

        self.vision_model = SentenceTransformer(
            vision_model_name,
            cache_folder=cache_dir.as_posix(),
            **model_kwargs,
        )

        if vision_model_name == text_model_name:
            self.text_model = self.vision_model
        else:
            self.text_model = SentenceTransformer(
                text_model_name,
                cache_folder=cache_dir.as_posix(),
                **model_kwargs,
            )

    def encode_text(self, text: str) -> list[float]:
        return self.encode_text_batch([text])[0]

    def encode_image(self, image: Image) -> list[float]:
        return self.encode_image_batch([image])[0]

    def encode_text_batch(self, texts: list[str]) -> list[list[float]]:
        embeddings: np.ndarray = self.text_model.encode(texts)  # type: ignore
        return embeddings.tolist()

    def encode_image_batch(self, images: list[Image]) -> list[list[float]]:
        embeddings: np.ndarray = self.vision_model.encode(images)  # type: ignore
        return embeddings.tolist()
