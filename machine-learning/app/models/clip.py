from typing import Any

from PIL.Image import Image
from sentence_transformers import SentenceTransformer

from ..schemas import ModelType
from .base import InferenceModel


class CLIPSTEncoder(InferenceModel):
    _model_type = ModelType.CLIP

    def _load(self, **model_kwargs: Any) -> SentenceTransformer:
        return SentenceTransformer(
            self.model_name,
            cache_folder=self.cache_dir.as_posix(),
            **model_kwargs,
        )

    # TODO return as ndarray so it uses shared memory and convert to list in ingress
    def _predict_batch(
        self,
        images_or_texts: list[Image] | list[str],
    ) -> list[list[float]]:
        return self.model.encode(images_or_texts).tolist()
