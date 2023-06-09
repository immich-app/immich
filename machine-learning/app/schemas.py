from typing import ParamSpec, TypeAlias, Literal, TypeVar
from pydantic import BaseModel


def to_lower_camel(string: str) -> str:
    tokens = [
        token.capitalize() if i > 0 else token
        for i, token in enumerate(string.split("_"))
    ]
    return "".join(tokens)


class VisionModelRequest(BaseModel):
    image_paths: str | list[str]

    class Config:
        alias_generator = to_lower_camel
        allow_population_by_field_name = True


class TextModelRequest(BaseModel):
    text: str | list[str]


class TextResponse(BaseModel):
    __root__: str


class MessageResponse(BaseModel):
    message: str


class Tags(BaseModel):
    __root__: list[str]


class TagResponse(BaseModel):
    __root__: Tags | list[Tags]


class Embedding(BaseModel):
    __root__: list[float]


class EmbeddingResponse(BaseModel):
    __root__: Embedding | list[Embedding]


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
    __root__: ImageFaces | list[ImageFaces]


ModelType: TypeAlias = Literal['image-classification', 'clip', 'facial-recognition', 'tokenizer', 'processor']
R = TypeVar("R")
P = ParamSpec("P")
