from typing import Any, List

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
        self.orientation_classify_enabled = model_kwargs.pop("orientationClassifyEnabled", True)
        self.unwarping_enabled = model_kwargs.pop("unwarpingEnabled", True)
        super().__init__(model_name, **model_kwargs)
        self._load()
        self.loaded = True

    def _load(self) -> PaddleOCR:
        self.model = PaddleOCR(
            text_detection_model_name=f"{self.model_name}_det",
            text_recognition_model_name=f"{self.model_name}_rec",
            use_doc_orientation_classify=self.orientation_classify_enabled,
            use_doc_unwarping=self.unwarping_enabled,
        )

    def _predict(self, inputs: NDArray[np.uint8] | bytes | Image.Image, **kwargs: Any) -> List[OCROutput]:
        inputs = decode_cv2(inputs)
        results = self.model.predict(inputs)
        valid_texts_and_scores = [
            (text, score, box)
            for result in results
            for text, score, box in zip(result['rec_texts'], result['rec_scores'], result['rec_polys'])
            if score >= self.min_score
        ]
        if not valid_texts_and_scores:
            return []
        
        return [
            OCROutput(
                text=text, confidence=score,
                x1=box[0][0], y1=box[0][1], x2=box[1][0], y2=box[1][1],
                x3=box[2][0], y3=box[2][1], x4=box[3][0], y4=box[3][1]
            )
            for text, score, box in valid_texts_and_scores
        ]
