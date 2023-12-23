from enum import StrEnum
from typing import Any, Protocol, TypeAlias, TypedDict, TypeGuard

import numpy as np
from pydantic import BaseModel

ndarray_f32: TypeAlias = np.ndarray[int, np.dtype[np.float32]]
ndarray_i64: TypeAlias = np.ndarray[int, np.dtype[np.int64]]
ndarray_i32: TypeAlias = np.ndarray[int, np.dtype[np.int32]]


class TextResponse(BaseModel):
    __root__: str


class MessageResponse(BaseModel):
    message: str


class BoundingBox(TypedDict):
    x1: int
    y1: int
    x2: int
    y2: int


class ModelType(StrEnum):
    CLIP = "clip"
    FACIAL_RECOGNITION = "facial-recognition"


class HasProfiling(Protocol):
    profiling: dict[str, float]


class Face(TypedDict):
    boundingBox: BoundingBox
    embedding: ndarray_f32
    imageWidth: int
    imageHeight: int
    score: float


def has_profiling(obj: Any) -> TypeGuard[HasProfiling]:
    return hasattr(obj, "profiling") and type(obj.profiling) == dict
