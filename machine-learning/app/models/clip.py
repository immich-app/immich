from pathlib import Path

from PIL.Image import Image
from sentence_transformers import SentenceTransformer

from ..schemas import ModelType
from .base import InferenceModel


class CLIPSTEncoder(InferenceModel):
    _model_type = ModelType.CLIP

    def __init__(
        self,
        model_name: str,
        cache_dir: Path | None = None,
        **model_kwargs,
    ):
        super().__init__(model_name, cache_dir)
        self.model = SentenceTransformer(
            self.model_name,
            cache_folder=self.cache_dir.as_posix(),
            **model_kwargs,
        )

    def predict(self, image_or_text: Image | str) -> list[float]:
        return self.model.encode(image_or_text).tolist()


# stubs to allow different behavior between the two in the future
# and handle loading different image and text clip models
class CLIPSTVisionEncoder(CLIPSTEncoder):
    _model_type = ModelType.CLIP_VISION


class CLIPSTTextEncoder(CLIPSTEncoder):
    _model_type = ModelType.CLIP_TEXT
