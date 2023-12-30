from enum import StrEnum
from typing import Any, Protocol, TypedDict, TypeGuard

import numpy as np
import numpy.typing as npt
from pydantic import BaseModel


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
    embedding: npt.NDArray[np.float32]
    imageWidth: int
    imageHeight: int
    score: float


class ClusterRequest(BaseModel):
    embeddings: list[list[float]]
    min_cluster_size: int = 5
    min_samples: int = None
    cluster_selection_epsilon: float = 0.0
    max_cluster_size: int = 0
    metric: str = "euclidean"
    alpha: float = 1.0
    algorithm: str = "best"
    leaf_size: int = 40
    approx_min_span_tree: bool = True
    cluster_selection_method: str = "eom"
    
    class Config:
        arbitrary_types_allowed = True


def has_profiling(obj: Any) -> TypeGuard[HasProfiling]:
    return hasattr(obj, "profiling") and isinstance(obj.profiling, dict)


def is_ndarray(obj: Any, dtype: "type[np._DTypeScalar_co]") -> "TypeGuard[npt.NDArray[np._DTypeScalar_co]]":
    return isinstance(obj, np.ndarray) and obj.dtype == dtype
