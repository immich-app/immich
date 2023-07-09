from pathlib import Path
from typing import Any

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
        return self.model.encode(image_or_text).tolist()
