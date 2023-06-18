from pathlib import Path
from typing import Any

from PIL.Image import Image
from transformers.pipelines import pipeline

from ..config import get_cache_dir, settings
from ..schemas import ModelType


class ImageClassifier:
    def __init__(
        self,
        model_name: str,
        min_score: float | None = None,
        cache_dir: Path | None = None,
        **model_kwargs,
    ):
        self.model_name = model_name
        self.min_score = min_score if min_score is not None else settings.min_tag_score
        if cache_dir is None:
            cache_dir = get_cache_dir(model_name, ModelType.IMAGE_CLASSIFICATION)

        self.model = pipeline(
            ModelType.IMAGE_CLASSIFICATION.value,
            self.model_name,
            model_kwargs={"cache_dir": cache_dir, **model_kwargs},
        )

    def classify(self, image: Image) -> list[str]:
        predictions = self.model(image)
        tags = list(
            {
                tag
                for pred in predictions
                for tag in pred["label"].split(", ")
                if pred["score"] >= self.min_score
            }
        )
        return tags
