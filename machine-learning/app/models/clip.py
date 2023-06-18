from pathlib import Path

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
        return self.text_model.encode(text).tolist()

    def encode_image(self, image: Image) -> list[float]:
        return self.vision_model.encode(image).tolist()
