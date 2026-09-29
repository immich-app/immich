from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass
from enum import Enum
from typing import Annotated, Any, Protocol, TypeAlias

import numpy as np
import numpy.typing as npt
from pydantic import ConfigDict, Field
from typing_extensions import TypedDict


class StrEnum(str, Enum):
    __str__ = str.__str__


class BoundingBox(TypedDict):
    x1: int
    y1: int
    x2: int
    y2: int


class ModelTask(StrEnum):
    FACIAL_RECOGNITION = "facial-recognition"
    SEARCH = "clip"
    OCR = "ocr"


class ModelType(StrEnum):
    DETECTION = "detection"
    RECOGNITION = "recognition"
    TEXTUAL = "textual"
    VISUAL = "visual"


class ModelFormat(StrEnum):
    ARMNN = "armnn"
    ONNX = "onnx"
    RKNN = "rknn"


class ModelSource(StrEnum):
    INSIGHTFACE = "insightface"
    MCLIP = "mclip"
    OPENCLIP = "openclip"
    PADDLE = "paddle"


class ModelOrganization(StrEnum):
    APP = "immich-app"
    TESTING = "immich-testing"


ModelIdentity = tuple[ModelType, ModelTask]


class SessionNode(Protocol):
    @property
    def name(self) -> str: ...

    @property
    def shape(self) -> tuple[int | str, ...]: ...  # ORT names a symbolic dim rather than sizing it


ModelTensor: TypeAlias = npt.NDArray[np.float32] | npt.NDArray[np.int32] | npt.NDArray[np.uint8]
ModelInput = Mapping[str, ModelTensor]


@dataclass(frozen=True)
class Shape:
    batch: int
    height: int | None = None
    width: int | None = None

    @property
    def pins(self) -> dict[str, int]:
        return {name: size for name, size in asdict(self).items() if size is not None}


class ModelGraph(Protocol):
    def run(
        self,
        output_names: list[str] | None,
        input_feed: ModelInput,
        run_options: Any = None,
    ) -> list[npt.NDArray[np.float32]]: ...

    def get_inputs(self) -> Sequence[SessionNode]: ...

    def get_outputs(self) -> Sequence[SessionNode]: ...

    def get_metadata(self) -> dict[str, str]: ...

    @property
    def normalizes_input(self) -> bool: ...


class ModelSession(Protocol):
    @property
    def shapes(self) -> tuple[Shape, ...]: ...

    @property
    def batches(self) -> tuple[int, ...]: ...

    def for_shape(self, shape: Shape) -> ModelGraph: ...

    def warm(self) -> None: ...


class FaceDetectionOutput(TypedDict):
    boxes: npt.NDArray[np.float32]
    scores: npt.NDArray[np.float32]
    landmarks: npt.NDArray[np.float32]


class DetectedFace(TypedDict):
    boundingBox: BoundingBox
    embedding: str
    score: float


FacialRecognitionOutput = list[DetectedFace]


class Options:
    __pydantic_config__ = ConfigDict(extra="ignore")  # so that an older service ignores an option a newer server adds


@dataclass(frozen=True)
class VisualOptions(Options):
    pass


@dataclass(frozen=True)
class TextualOptions(Options):
    language: str | None = None


@dataclass(frozen=True)
class FaceDetectionOptions(Options):
    min_score: Annotated[float, Field(alias="minScore")] = 0.7


@dataclass(frozen=True)
class FaceRecognitionOptions(Options):
    pass


@dataclass(frozen=True)
class TextDetectionOptions(Options):
    max_resolution: Annotated[int, Field(alias="maxResolution")] = 736
    min_score: Annotated[float, Field(alias="minScore")] = 0.5


@dataclass(frozen=True)
class TextRecognitionOptions(Options):
    min_score: Annotated[float, Field(alias="minScore")] = 0.9


InferenceResponse = dict[str, Any]
