from typing import Any

from app.schemas import ModelType

from .base import InferenceModel
from .clip import MCLIPEncoder, OpenCLIPEncoder
from .facial_recognition import FaceRecognizer
from .image_classification import ImageClassifier


def from_model_type(model_type: ModelType, model_name: str, **model_kwargs: Any) -> InferenceModel:
    if model_type == ModelType.CLIP and model_name is not None and "M-CLIP" in model_name:
        return MCLIPEncoder(model_name, **model_kwargs)

    match model_type:
        case ModelType.CLIP:
            return OpenCLIPEncoder(model_name, **model_kwargs)
        case ModelType.FACIAL_RECOGNITION:
            return FaceRecognizer(model_name, **model_kwargs)
        case ModelType.IMAGE_CLASSIFICATION:
            return ImageClassifier(model_name, **model_kwargs)
        case _:
            raise ValueError(f"Unknown model type {model_type}")
