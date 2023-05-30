from pydantic import BaseModel
from typing import TypeAlias, Optional


def to_lower_camel(string: str) -> str:
    tokens = [
        token.capitalize() if i > 0 else token
        for i, token in enumerate(string.split("_"))
    ]
    return "".join(tokens)


Embedding: TypeAlias = list[float]


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class VisionModelRequest(BaseModel):
    image_path: str
    min_score: Optional[float]

    class Config:
        alias_generator = to_lower_camel
        allow_population_by_field_name = True


class TextModelRequest(BaseModel):
    text: str


class CLIPEmbeddingResponse(BaseModel):
    embedding: Embedding | list[Embedding]


class ImageFace(BaseModel):
    image_width: int
    image_height: int
    bounding_box: BoundingBox
    score: float
    embedding: Embedding

    class Config:
        alias_generator = to_lower_camel
        allow_population_by_field_name = True


ImageClassificationResponse: TypeAlias = list[str]
FacialRecognitionResponse: TypeAlias = list[ImageFace]
