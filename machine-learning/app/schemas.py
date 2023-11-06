from enum import StrEnum
from typing import TypeAlias

import numpy as np
from pydantic import BaseModel


def to_lower_camel(string: str) -> str:
    tokens = [token.capitalize() if i > 0 else token for i, token in enumerate(string.split("_"))]
    return "".join(tokens)


class TextModelRequest(BaseModel):
    text: str


class TextResponse(BaseModel):
    __root__: str


class MessageResponse(BaseModel):
    message: str


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class ModelType(StrEnum):
    IMAGE_CLASSIFICATION = "image-classification"
    CLIP = "clip"
    FACIAL_RECOGNITION = "facial-recognition"


ndarray_f32: TypeAlias = np.ndarray[int, np.dtype[np.float32]]
ndarray_i64: TypeAlias = np.ndarray[int, np.dtype[np.int64]]
ndarray_i32: TypeAlias = np.ndarray[int, np.dtype[np.int32]]
