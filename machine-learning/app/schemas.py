from enum import Enum
from typing import Any, Literal, Protocol, TypedDict, TypeGuard, TypeVar

import numpy as np
import numpy.typing as npt
from pydantic import BaseModel


class StrEnum(str, Enum):
    value: str

    def __str__(self) -> str:
        return self.value


class TextResponse(BaseModel):
    __root__: str


class MessageResponse(BaseModel):
    message: str


class BoundingBox(TypedDict):
    x1: int
    y1: int
    x2: int
    y2: int


class ModelTask(StrEnum):
    FACIAL_RECOGNITION = "facial-recognition"
    SEARCH = "clip"


class ModelType(StrEnum):
    DETECTION = "detection"
    RECOGNITION = "recognition"
    TEXTUAL = "textual"
    VISUAL = "visual"


class ModelFormat(StrEnum):
    ARMNN = "armnn"
    ONNX = "onnx"


class ModelSource(StrEnum):
    INSIGHTFACE = "insightface"
    MCLIP = "mclip"
    OPENCLIP = "openclip"


ModelIdentity = tuple[ModelType, ModelTask]


class SessionNode(Protocol):
    @property
    def name(self) -> str | None: ...

    @property
    def shape(self) -> tuple[int, ...]: ...


class ModelSession(Protocol):
    def run(
        self,
        output_names: list[str] | None,
        input_feed: dict[str, npt.NDArray[np.float32]] | dict[str, npt.NDArray[np.int32]],
        run_options: Any = None,
    ) -> list[npt.NDArray[np.float32]]: ...

    def get_inputs(self) -> list[SessionNode]: ...

    def get_outputs(self) -> list[SessionNode]: ...


class HasProfiling(Protocol):
    profiling: dict[str, float]


class FaceDetectionOutput(TypedDict):
    boxes: npt.NDArray[np.float32]
    scores: npt.NDArray[np.float32]
    landmarks: npt.NDArray[np.float32]


class DetectedFace(TypedDict):
    boundingBox: BoundingBox
    embedding: npt.NDArray[np.float32]
    score: float


FacialRecognitionOutput = list[DetectedFace]


class PipelineEntry(TypedDict):
    modelName: str
    options: dict[str, Any]


PipelineRequest = dict[ModelTask, dict[ModelType, PipelineEntry]]


class InferenceEntry(TypedDict):
    name: str
    task: ModelTask
    type: ModelType
    options: dict[str, Any]


InferenceEntries = tuple[list[InferenceEntry], list[InferenceEntry]]


InferenceResponse = dict[ModelTask | Literal["imageHeight"] | Literal["imageWidth"], Any]


def has_profiling(obj: Any) -> TypeGuard[HasProfiling]:
    return hasattr(obj, "profiling") and isinstance(obj.profiling, dict)


def is_ndarray(obj: Any, dtype: "type[np._DTypeScalar_co]") -> "TypeGuard[npt.NDArray[np._DTypeScalar_co]]":
    return isinstance(obj, np.ndarray) and obj.dtype == dtype


T = TypeVar("T")
