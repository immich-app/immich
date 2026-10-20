from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Annotated, Any

from pydantic import ConfigDict, Field, with_config

from .models.base import InferenceEntry, InferenceModel
from .models.clip.textual import BaseCLIPTextualEncoder, MClipTextualEncoder, OpenClipTextualEncoder
from .models.clip.visual import OpenClipVisualEncoder
from .models.constants import get_model_source
from .models.facial_recognition.detection import FaceDetector
from .models.facial_recognition.recognition import FaceRecognizer
from .models.ocr.detection import TextDetector
from .models.ocr.recognition import TextRecognizer
from .schemas import (
    FaceDetectionOptions,
    FaceRecognitionOptions,
    ModelSource,
    Options,
    TextDetectionOptions,
    TextRecognitionOptions,
    TextualOptions,
    VisualOptions,
)

STRICT = ConfigDict(extra="forbid")


def textual(model_name: str) -> type[BaseCLIPTextualEncoder]:
    return MClipTextualEncoder if get_model_source(model_name) == ModelSource.MCLIP else OpenClipTextualEncoder


@with_config(STRICT)
@dataclass(frozen=True)
class Slot[O: Options]:
    model_name: Annotated[str, Field(alias="modelName")]
    options: Annotated[O, Field(default_factory=dict, validate_default=True)]  # left out, it takes their defaults

    def entry(self, model: type[InferenceModel[O]]) -> InferenceEntry[O]:
        return InferenceEntry(model, self.model_name, self.options)


@with_config(STRICT)
@dataclass(frozen=True)
class Clip:
    visual: Slot[VisualOptions] | None = None
    textual: Slot[TextualOptions] | None = None


@with_config(STRICT)
@dataclass(frozen=True)
class FacialRecognition:
    detection: Slot[FaceDetectionOptions] | None = None
    recognition: Slot[FaceRecognitionOptions] | None = None


@with_config(STRICT)
@dataclass(frozen=True)
class Ocr:
    detection: Slot[TextDetectionOptions] | None = None
    recognition: Slot[TextRecognitionOptions] | None = None


@with_config(STRICT)
@dataclass(frozen=True)
class PipelineRequest:
    clip: Clip = field(default_factory=Clip)
    facial_recognition: Annotated[FacialRecognition, Field(alias="facial-recognition")] = field(
        default_factory=FacialRecognition
    )
    ocr: Ocr = field(default_factory=Ocr)

    def entries(self) -> Iterator[InferenceEntry[Any]]:
        if (visual := self.clip.visual) is not None:
            yield visual.entry(OpenClipVisualEncoder)
        if (text := self.clip.textual) is not None:
            yield text.entry(textual(text.model_name))
        if (detection := self.facial_recognition.detection) is not None:
            yield detection.entry(FaceDetector)
        if (recognition := self.facial_recognition.recognition) is not None:
            yield recognition.entry(FaceRecognizer)
        if (boxes := self.ocr.detection) is not None:
            yield boxes.entry(TextDetector)
        if (reading := self.ocr.recognition) is not None:
            yield reading.entry(TextRecognizer)
