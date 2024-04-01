from typing import Any

from app.models.clip.textual import MClipTextualEncoder, OpenClipTextualEncoder
from app.models.clip.visual import OpenClipVisualEncoder
from app.schemas import ModelSource, ModelTask, ModelType, Predictor

from .constants import get_model_source
from .facial_recognition.detection import FaceDetector
from .facial_recognition.recognition import FaceRecognizer


def from_model_type(model_name: str, model_type: ModelType, model_task: ModelTask, **model_kwargs: Any) -> Predictor:
    source = get_model_source(model_name)
    match source, model_type, model_task:
        case ModelSource.OPENCLIP | ModelSource.MCLIP, ModelType.VISUAL, ModelTask.SEARCH:
            return OpenClipVisualEncoder(model_name, **model_kwargs)

        case ModelSource.OPENCLIP, ModelType.TEXTUAL, ModelTask.SEARCH:
            return OpenClipTextualEncoder(model_name, **model_kwargs)

        case ModelSource.MCLIP, ModelType.TEXTUAL, ModelTask.SEARCH:
            return MClipTextualEncoder(model_name, **model_kwargs)

        case ModelSource.INSIGHTFACE, ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION:
            return FaceDetector(model_name, **model_kwargs)

        case ModelSource.INSIGHTFACE, ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION:
            return FaceRecognizer(model_name, **model_kwargs)

        case _:
            raise ValueError(f"Unknown model combination: {source}, {model_type}, {model_task}")
