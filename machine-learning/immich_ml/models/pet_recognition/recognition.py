from typing import Any

import numpy as np
import cv2
from numpy.typing import NDArray
from PIL import Image

from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2, normalize, serialize_np_array
from immich_ml.schemas import PetDetectionOutput, PetRecognitionOutput, ModelTask, ModelType


class PetRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.PET_DETECTION)]
    identity = (ModelType.RECOGNITION, ModelTask.PET_RECOGNITION)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        super().__init__(model_name, **model_kwargs)

    def _predict(
        self, inputs: NDArray[np.uint8] | bytes | Image.Image, pets: PetDetectionOutput
    ) -> PetRecognitionOutput:
        if pets["boxes"].shape[0] == 0:
            return []

        img = decode_cv2(inputs)
        
        results: PetRecognitionOutput = []
        for (x1, y1, x2, y2), score, label in zip(pets["boxes"], pets["scores"], pets["labels"]):
            # Ensure crop is within bounds
            x1, y1 = max(0, int(x1)), max(0, int(y1))
            x2, y2 = min(img.shape[1], int(x2)), min(img.shape[0], int(y2))
            
            if x2 <= x1 or y2 <= y1:
                continue

            crop = img[y1:y2, x1:x2]
            
            # Resize crop to 384x384
            crop_resized = cv2.resize(crop, (384, 384), interpolation=cv2.INTER_CUBIC)
            crop_resized = crop_resized.astype(np.float32) / 255.0
            
            # ImageNet normalization
            mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
            std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
            crop_normalized = normalize(crop_resized, mean, std)
            
            crop_input = crop_normalized.transpose(2, 0, 1)  # HWC to CHW
            crop_input = np.expand_dims(crop_input, axis=0)

            outputs = self.session.run(None, {self.session.get_inputs()[0].name: crop_input})
            embedding: NDArray[np.float32] = outputs[0][0]
            
            results.append({
                "boundingBox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "embedding": serialize_np_array(embedding),
                "score": float(score),
                "label": int(label)
            })
            
        return results
