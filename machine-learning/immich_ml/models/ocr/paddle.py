from typing import Any

import numpy as np
from numpy.typing import NDArray
from paddleocr import PaddleOCR
from PIL import Image
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2
from immich_ml.schemas import OCROutput, ModelTask, ModelType

class PaddleOCRecognizer(InferenceModel):
    depends = []
    identity = (ModelType.OCR, ModelTask.OCR)

    def __init__(self, model_name: str, min_score: float = 0.9, **model_kwargs: Any) -> None:
        self.min_score = model_kwargs.pop("minScore", min_score)
        super().__init__(model_name, **model_kwargs)
        self._load()
        self.loaded = True

    def _load(self) -> None:
        try:
            self.model = PaddleOCR(
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False
            )
        except Exception as e:
            print(f"Error loading PaddleOCR model: {e}")
            raise e

    def _predict(self, inputs: NDArray[np.uint8] | bytes | Image.Image, **kwargs: Any) -> OCROutput:
        inputs = decode_cv2(inputs)
        results = self.model.predict(inputs)
        valid_texts_and_scores = [
            (text, score)
            for result in results
            for text, score in zip(result['rec_texts'], result['rec_scores'])
            if score > self.min_score
        ]
        if not valid_texts_and_scores:
            return OCROutput(text="", confidence=0.0)
        texts, scores = zip(*valid_texts_and_scores)
        return OCROutput(
            text="".join(texts),
            confidence=sum(scores) / len(scores)
        )
