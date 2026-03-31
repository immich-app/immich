from typing import Any

import numpy as np
import cv2
from numpy.typing import NDArray

from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2
from immich_ml.schemas import PetDetectionOutput, ModelTask, ModelType


class PetDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.PET_DETECTION)

    def __init__(self, model_name: str, min_score: float = 0.5, **model_kwargs: Any) -> None:
        self.min_score = model_kwargs.pop("minScore", min_score)
        super().__init__(model_name, **model_kwargs)

    def _predict(self, inputs: NDArray[np.uint8] | bytes) -> PetDetectionOutput:
        img = decode_cv2(inputs)
        original_h, original_w = img.shape[:2]

        # Resize to 640x640 for YOLOv8
        img_resized = cv2.resize(img, (640, 640))
        img_input = img_resized.transpose(2, 0, 1)  # HWC to CHW
        img_input = img_input.astype(np.float32) / 255.0
        img_input = np.expand_dims(img_input, axis=0)

        outputs = self.session.run(None, {self.session.get_inputs()[0].name: img_input})
        # YOLOv8 output: [1, 84, 8400]
        output = outputs[0][0]
        
        # Transpose to [8400, 84]
        output = output.T
        
        # Scores are from column 4 onwards
        scores = output[:, 4:]
        max_scores = np.max(scores, axis=1)
        max_labels = np.argmax(scores, axis=1)
        
        # Filter for Cat (15) and Dog (16)
        mask = (max_scores >= self.min_score) & ((max_labels == 15) | (max_labels == 16))
        
        filtered_boxes = output[mask, :4]
        filtered_scores = max_scores[mask]
        filtered_labels = max_labels[mask]
        
        # Convert xywh (relative to 640x640) to xyxy
        x_center, y_center, w, h = filtered_boxes[:, 0], filtered_boxes[:, 1], filtered_boxes[:, 2], filtered_boxes[:, 3]
        x1 = (x_center - w / 2) * (original_w / 640)
        y1 = (y_center - h / 2) * (original_h / 640)
        x2 = (x_center + w / 2) * (original_w / 640)
        y2 = (y_center + h / 2) * (original_h / 640)
        
        boxes = np.stack([x1, y1, x2, y2], axis=1)
        
        return {
            "boxes": boxes,
            "scores": filtered_scores,
            "labels": filtered_labels.astype(np.int32),
        }

    def configure(self, **kwargs: Any) -> None:
        self.min_score = kwargs.pop("minScore", self.min_score)
