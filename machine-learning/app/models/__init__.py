from typing import Any

from app.schemas import ModelType

from .base import InferenceModel
from .clip import MCLIPEncoder, OpenCLIPEncoder
from .constants import is_insightface, is_mclip, is_openclip
from .facial_recognition import FaceRecognizer


def from_model_type(model_type: ModelType, model_name: str, **model_kwargs: Any) -> InferenceModel:
    match model_type:
        case ModelType.CLIP:
            if is_openclip(model_name):
                return OpenCLIPEncoder(model_name, **model_kwargs)
            elif is_mclip(model_name):
                return MCLIPEncoder(model_name, **model_kwargs)
        case ModelType.FACIAL_RECOGNITION:
            if is_insightface(model_name):
                return FaceRecognizer(model_name, **model_kwargs)
        case _:
            raise ValueError(f"Unknown model type {model_type}")

    raise ValueError(f"Unknown {model_type} model {model_name}")
