from collections.abc import Iterable

import numpy as np
import numpy.typing as npt
from typing_extensions import TypedDict


class TextDetectionOutput(TypedDict):
    boxes: npt.NDArray[np.float32]
    scores: npt.NDArray[np.float32]


class TextRecognitionOutput(TypedDict):
    box: npt.NDArray[np.float32]
    boxScore: npt.NDArray[np.float32]
    text: Iterable[str]
    textScore: npt.NDArray[np.float32]
