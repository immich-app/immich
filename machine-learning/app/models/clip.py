from pathlib import Path
from typing import Any

import numpy as np
from PIL.Image import Image
from sentence_transformers import SentenceTransformer

from ..schemas import ModelType
from .base import InferenceModel


class CLIPSTEncoder(InferenceModel):
    _model_type = ModelType.CLIP

    def load(self, **model_kwargs: Any) -> None:
        self.model = SentenceTransformer(
            self.model_name,
            cache_folder=self.cache_dir.as_posix(),
            **model_kwargs,
        )

    def predict(self, image_or_text: Image | str) -> list[float]:
        return self.predict_batch([image_or_text])[0]  # type: ignore

    # TODO return as ndarray so it uses shared memory and convert to list in ingress
    def predict_batch(
        self,
        images_or_texts: list[Image] | list[str],
    ) -> list[list[float]]:
        return self.model.encode(images_or_texts).tolist()
