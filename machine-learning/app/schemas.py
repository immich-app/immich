from enum import Enum
from typing import Any, NamedTuple, Protocol, TypedDict, TypeGuard

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
    PIPELINE = "pipeline"
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


class ModelSession(Protocol):
    def run(
        self,
        output_names: list[str] | None,
        input_feed: dict[str, npt.NDArray[np.float32]] | dict[str, npt.NDArray[np.int32]],
        run_options: Any = None,
    ) -> list[npt.NDArray[np.float32]]: ...


class Predictor(Protocol):
    loaded: bool

    def load(self) -> None: ...

    def predict(self, inputs: Any, **model_kwargs: Any) -> Any: ...


class HasProfiling(Protocol):
    profiling: dict[str, float]


class DetectedFaces(NamedTuple):
    bounding_boxes: npt.NDArray[np.float32]
    scores: npt.NDArray[np.float32]
    landmarks: npt.NDArray[np.float32] | None


class FacialRecognitionResult(TypedDict):
    boundingBox: BoundingBox
    embedding: list[float]
    imageHeight: int
    imageWidth: int
    score: float


FacialRecognitionResponse = list[FacialRecognitionResult]


def has_profiling(obj: Any) -> TypeGuard[HasProfiling]:
    return hasattr(obj, "profiling") and isinstance(obj.profiling, dict)


def is_ndarray(obj: Any, dtype: "type[np._DTypeScalar_co]") -> "TypeGuard[npt.NDArray[np._DTypeScalar_co]]":
    return isinstance(obj, np.ndarray) and obj.dtype == dtype
