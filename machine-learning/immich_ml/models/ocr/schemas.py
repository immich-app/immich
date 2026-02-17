from typing import Any, Iterable

import numpy as np
import numpy.typing as npt
from rapidocr.utils.typings import EngineType, LangRec
from typing_extensions import TypedDict


class TextDetectionOutput(TypedDict):
    boxes: npt.NDArray[np.float32]
    scores: npt.NDArray[np.float32]


class TextRecognitionOutput(TypedDict):
    box: npt.NDArray[np.float32]
    boxScore: npt.NDArray[np.float32]
    text: Iterable[str]
    textScore: npt.NDArray[np.float32]


# RapidOCR expects `engine_type`, `lang_type`, and `font_path` to be attributes
class OcrOptions(dict[str, Any]):
    def __init__(self, lang_type: LangRec | None = None, **options: Any) -> None:
        super().__init__(**options)
        self.engine_type = EngineType.ONNXRUNTIME
        self.lang_type = lang_type
        self.font_path = None
