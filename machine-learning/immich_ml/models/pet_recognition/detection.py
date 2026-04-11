from typing import Any

import cv2
import numpy as np
from numpy.typing import NDArray

from immich_ml.config import log
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2
from immich_ml.schemas import ModelTask, ModelType, PetDetectionOutput


class PetDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.PET_RECOGNITION)
    hf_repo = "Quazim0t0/yolov8-onnx"
    model_file = "yolo11n.onnx"
    use_type_subfolder = False

    def __init__(self, model_name: str, min_score: float = 0.5, **model_kwargs: Any) -> None:
        detection_model_name = model_kwargs.get("detectionModelName", model_name)
        if detection_model_name == "pet-recognition":
            # Default to a compatible model
            model_name = "yolov8n"
            self.hf_repo = "Quazim0t0/yolov8-onnx"
            self.model_file = "yolo11n.onnx"
        elif "/" in detection_model_name:
            # Allow users to specify a custom Hugging Face repo
            model_name = detection_model_name
            self.hf_repo = detection_model_name
            self.model_file = model_kwargs.get("modelFile", self.model_file)
        else:
            model_name = detection_model_name

        self.hf_repo = model_kwargs.get("hfRepo", self.hf_repo)
        self.model_file = model_kwargs.get("modelFile", self.model_file)

        self.min_score = model_kwargs.pop("minScore", min_score)
        super().__init__(model_name, **model_kwargs)

    def _predict(self, inputs: NDArray[np.uint8] | bytes) -> PetDetectionOutput:
        img = decode_cv2(inputs)
        original_h, original_w = img.shape[:2]

        # Resize to 640x480 for this specific YOLOv11 model
        img_resized = cv2.resize(img, (640, 480))
        img_input = img_resized.transpose(2, 0, 1)  # HWC to CHW
        img_input = img_input.astype(np.float32) / 255.0
        img_input = np.expand_dims(img_input, axis=0)

        outputs = self.session.run(None, {self.session.get_inputs()[0].name: img_input})
        # Output shape: [1, 300, 6] -> [x1, y1, x2, y2, score, class_id]
        output = outputs[0][0]

        # Filter by score and classes (Cat=15, Dog=16)
        scores = output[:, 4]
        labels = output[:, 5].astype(np.int32)
        
        mask = (scores >= self.min_score) & ((labels == 15) | (labels == 16))
        
        filtered_output = output[mask]
        log.debug(f"Found {len(filtered_output)} pets")
        
        if len(filtered_output) == 0:
            return {
                "boxes": np.zeros((0, 4), dtype=np.float32),
                "scores": np.zeros((0,), dtype=np.float32),
                "labels": np.zeros((0,), dtype=np.int32),
            }

        boxes = filtered_output[:, :4]
        filtered_scores = filtered_output[:, 4]
        filtered_labels = filtered_output[:, 5].astype(np.int32)

        # Scale boxes back to original image size
        # x coordinates are index 0 and 2, y are 1 and 3
        boxes[:, [0, 2]] *= (original_w / 640)
        boxes[:, [1, 3]] *= (original_h / 480)

        return {
            "boxes": boxes,
            "scores": filtered_scores,
            "labels": filtered_labels,
        }

    def configure(self, **kwargs: Any) -> None:
        self.min_score = kwargs.pop("minScore", self.min_score)
