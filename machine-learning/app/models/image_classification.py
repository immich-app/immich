from pathlib import Path
from typing import Any

from PIL.Image import Image
from transformers.pipelines import pipeline

from ..config import settings
from ..schemas import ModelType
from .base import InferenceModel


class ImageClassifier(InferenceModel):
    _model_type = ModelType.IMAGE_CLASSIFICATION

    def __init__(
        self,
        model_name: str,
        min_score: float = settings.min_tag_score,
        cache_dir: Path | str | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.min_score = min_score
        super().__init__(model_name, cache_dir, **model_kwargs)

    def load(self, **model_kwargs: Any) -> None:
        self.model = pipeline(
            self.model_type.value,
            self.model_name,
            model_kwargs={"cache_dir": self.cache_dir, **model_kwargs},
        )

    def predict(self, image: Image) -> list[str]:
        predictions: list[dict[str, Any]] = self.model(image)  # type: ignore
        tags = self._postprocess(predictions)

        return tags

    def predict_batch(self, images: list[Image]) -> list[list[str]]:
        batch_predictions: list[list[dict[str, Any]]] = self.model(images)  # type: ignore
        results = [self._postprocess(predictions) for predictions in batch_predictions]

        return results

    def _postprocess(self, predictions: list[dict[str, Any]]) -> list[str]:
        return [tag for pred in predictions for tag in pred["label"].split(", ") if pred["score"] >= self.min_score]
