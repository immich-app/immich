from typing import Any, Iterable

import numpy as np
import numpy.typing as npt
from rapidocr.utils.typings import EngineType, LangRec, OCRVersion
from rapidocr.utils.typings import ModelType as RapidModelType
from typing_extensions import TypedDict


def resolve_ocr_version_and_type(model_name: str) -> tuple[OCRVersion, RapidModelType]:
    if "PP-OCRv6" in model_name:
        if "tiny" in model_name:
            return OCRVersion.PPOCRV6, RapidModelType.TINY
        if "medium" in model_name:
            return OCRVersion.PPOCRV6, RapidModelType.MEDIUM
        return OCRVersion.PPOCRV6, RapidModelType.SMALL
    return OCRVersion.PPOCRV5, RapidModelType.MOBILE if "mobile" in model_name else RapidModelType.SERVER


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
