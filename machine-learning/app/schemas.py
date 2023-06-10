from enum import StrEnum
from typing import ParamSpec, TypeVar
from pydantic import BaseModel


def to_lower_camel(string: str) -> str:
    tokens = [
        token.capitalize() if i > 0 else token
        for i, token in enumerate(string.split("_"))
    ]
    return "".join(tokens)


class VisionModelRequest(BaseModel):
    image_paths: list[str]

    class Config:
        alias_generator = to_lower_camel
        allow_population_by_field_name = True


class TextModelRequest(BaseModel):
    text: list[str]


class TextResponse(BaseModel):
    __root__: str


class MessageResponse(BaseModel):
    message: str


class Tags(BaseModel):
    __root__: list[str]


class TagResponse(BaseModel):
    __root__: list[Tags]


class Embedding(BaseModel):
    __root__: list[float]


class EmbeddingResponse(BaseModel):
    __root__: list[Embedding]


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class Face(BaseModel):
    bounding_box: BoundingBox
    score: float
    embedding: Embedding

    class Config:
        alias_generator = to_lower_camel
        allow_population_by_field_name = True


class ImageFaces(BaseModel):
    image_width: int
    image_height: int
    faces: list[Face]

    class Config:
        alias_generator = to_lower_camel
        allow_population_by_field_name = True


class FaceResponse(BaseModel):
    __root__: list[ImageFaces]


class ModelType(StrEnum):
    IMAGE_CLASSIFICATION = 'image-classification'
    CLIP = 'clip'
    FACIAL_RECOGNITION = 'facial-recognition'
    TOKENIZER = 'tokenizer'
    PROCESSOR = 'processor'


R = TypeVar("R")
P = ParamSpec("P")
