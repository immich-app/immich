from typing import Iterable

import numpy as np
import numpy.typing as npt
from rapidocr.utils.typings import EngineType
from typing_extensions import TypedDict


class TextDetectionOutput(TypedDict):
    resized: npt.NDArray[np.float32]
    boxes: npt.NDArray[np.float32]
    scores: Iterable[float]


class TextRecognitionOutput(TypedDict):
    box: npt.NDArray[np.float32]
    boxScore: Iterable[float]
    text: Iterable[str]
    textScore: Iterable[float]


# RapidOCR expects engine_type to be an attribute
class OcrOptions(dict):
    def __init__(self, **options):
        super().__init__(**options)
        self.engine_type = EngineType.ONNXRUNTIME
