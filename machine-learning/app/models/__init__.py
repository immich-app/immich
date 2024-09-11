from typing import Any

from app.models.base import InferenceModel
from app.models.clip.textual import MClipTextualEncoder, OpenClipTextualEncoder
from app.models.clip.visual import OpenClipVisualEncoder
from app.schemas import ModelSource, ModelTask, ModelType

from .constants import get_model_source
from .facial_recognition.detection import FaceDetector
from .facial_recognition.recognition import FaceRecognizer


def get_model_class(model_name: str, model_type: ModelType, model_task: ModelTask) -> type[InferenceModel]:
    source = get_model_source(model_name)
    match source, model_type, model_task:
        case ModelSource.OPENCLIP | ModelSource.MCLIP, ModelType.VISUAL, ModelTask.SEARCH:
            return OpenClipVisualEncoder

        case ModelSource.OPENCLIP, ModelType.TEXTUAL, ModelTask.SEARCH:
            return OpenClipTextualEncoder

        case ModelSource.MCLIP, ModelType.TEXTUAL, ModelTask.SEARCH:
            return MClipTextualEncoder

        case ModelSource.INSIGHTFACE, ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION:
            return FaceDetector

        case ModelSource.INSIGHTFACE, ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION:
            return FaceRecognizer

        case _:
            raise ValueError(f"Unknown model combination: {source}, {model_type}, {model_task}")


def from_model_type(model_name: str, model_type: ModelType, model_task: ModelTask, **kwargs: Any) -> InferenceModel:
    return get_model_class(model_name, model_type, model_task)(model_name, **kwargs)


def get_model_deps(model_name: str, model_type: ModelType, model_task: ModelTask) -> list[tuple[ModelType, ModelTask]]:
    return get_model_class(model_name, model_type, model_task).depends
