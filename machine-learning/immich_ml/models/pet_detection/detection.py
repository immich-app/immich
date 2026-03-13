from pathlib import Path
from typing import Any

import cv2
import numpy as np
from numpy.typing import NDArray

from immich_ml.config import clean_name
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2
from immich_ml.schemas import BoundingBox, ModelSession, ModelTask, ModelType, PetDetectionOutput

_HF_ORG = "Deeds67"

# COCO animal class IDs and labels
_ANIMAL_CLASSES: dict[int, str] = {
    14: "bird",
    15: "cat",
    16: "dog",
    17: "horse",
    18: "sheep",
    19: "cow",
    20: "elephant",
    21: "bear",
    22: "zebra",
    23: "giraffe",
}

_INPUT_SIZE = 640
_NMS_IOU_THRESHOLD = 0.45


class PetDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.PET_DETECTION)

    def __init__(self, model_name: str, min_score: float = 0.6, **model_kwargs: Any) -> None:
        self.min_score = model_kwargs.pop("minScore", min_score)
        super().__init__(model_name, **model_kwargs)

    @property
    def model_path(self) -> Path:
        # Support both conventions:
        # 1. Standard: detection/model.onnx (matches base class)
        # 2. Legacy: <model_name>.onnx at cache root (e.g. yolo11m.onnx)
        standard = super().model_path
        if standard.is_file():
            return standard
        alt = self.cache_dir / f"{self.model_name}.onnx"
        if alt.is_file():
            return alt
        return standard

    def _download(self) -> None:
        from huggingface_hub import snapshot_download

        snapshot_download(
            f"{_HF_ORG}/{clean_name(self.model_name)}",
            cache_dir=self.cache_dir,
            local_dir=self.cache_dir,
        )

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        input_name = session.get_inputs()[0].name
        if input_name is None:
            raise ValueError("Model input name is None")
        self._input_name: str = input_name
        return session

    def _predict(self, inputs: NDArray[np.uint8] | bytes) -> PetDetectionOutput:
        image = decode_cv2(inputs)
        orig_h, orig_w = image.shape[:2]

        blob = self._preprocess(image)
        outputs = self.session.run(None, {self._input_name: blob})
        raw = outputs[0]  # shape (1, 84, 8400)

        return self._postprocess(raw, orig_w, orig_h)

    def _preprocess(self, image: NDArray[np.uint8]) -> NDArray[np.float32]:
        resized = cv2.resize(image, (_INPUT_SIZE, _INPUT_SIZE))
        blob: NDArray[np.float32] = resized.astype(np.float32) / 255.0
        blob = np.transpose(blob, (2, 0, 1))  # HWC -> CHW
        blob = np.expand_dims(blob, axis=0)  # add batch dim -> NCHW
        return blob

    def _postprocess(self, raw: NDArray[np.float32], orig_w: int, orig_h: int) -> PetDetectionOutput:
        # raw shape: (1, 84, 8400) -> transpose to (8400, 84)
        predictions = raw[0].T  # (8400, 84)

        # Extract box coords (cx, cy, w, h) and class scores
        boxes_cxcywh = predictions[:, :4]
        class_scores = predictions[:, 4:]  # (8400, 80)

        # Get best class per detection
        class_ids = np.argmax(class_scores, axis=1)
        confidences = class_scores[np.arange(len(class_ids)), class_ids]

        # Filter by confidence threshold
        mask = confidences >= self.min_score
        boxes_cxcywh = boxes_cxcywh[mask]
        confidences = confidences[mask]
        class_ids = class_ids[mask]

        if len(boxes_cxcywh) == 0:
            return []

        # Filter to only animal classes
        animal_mask = np.array([int(cid) in _ANIMAL_CLASSES for cid in class_ids])
        boxes_cxcywh = boxes_cxcywh[animal_mask]
        confidences = confidences[animal_mask]
        class_ids = class_ids[animal_mask]

        if len(boxes_cxcywh) == 0:
            return []

        # Convert from cx,cy,w,h to x1,y1,x2,y2
        boxes_xyxy = np.empty_like(boxes_cxcywh)
        boxes_xyxy[:, 0] = boxes_cxcywh[:, 0] - boxes_cxcywh[:, 2] / 2
        boxes_xyxy[:, 1] = boxes_cxcywh[:, 1] - boxes_cxcywh[:, 3] / 2
        boxes_xyxy[:, 2] = boxes_cxcywh[:, 0] + boxes_cxcywh[:, 2] / 2
        boxes_xyxy[:, 3] = boxes_cxcywh[:, 1] + boxes_cxcywh[:, 3] / 2

        # Scale boxes from input size to original image size
        scale_x = orig_w / _INPUT_SIZE
        scale_y = orig_h / _INPUT_SIZE
        boxes_xyxy[:, 0] *= scale_x
        boxes_xyxy[:, 2] *= scale_x
        boxes_xyxy[:, 1] *= scale_y
        boxes_xyxy[:, 3] *= scale_y

        # Apply NMS
        indices = self._nms(boxes_xyxy, confidences, _NMS_IOU_THRESHOLD)
        boxes_xyxy = boxes_xyxy[indices]
        confidences = confidences[indices]
        class_ids = class_ids[indices]

        # Build output
        results: PetDetectionOutput = []
        for i in range(len(boxes_xyxy)):
            bbox: BoundingBox = {
                "x1": int(round(boxes_xyxy[i, 0])),
                "y1": int(round(boxes_xyxy[i, 1])),
                "x2": int(round(boxes_xyxy[i, 2])),
                "y2": int(round(boxes_xyxy[i, 3])),
            }
            results.append(
                {
                    "boundingBox": bbox,
                    "score": float(confidences[i]),
                    "label": _ANIMAL_CLASSES[int(class_ids[i])],
                }
            )

        return results

    @staticmethod
    def _nms(boxes: NDArray[np.float32], scores: NDArray[np.float32], iou_threshold: float) -> NDArray[np.intp]:
        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 2]
        y2 = boxes[:, 3]
        areas = (x2 - x1) * (y2 - y1)

        order = scores.argsort()[::-1]
        keep: list[int] = []

        while len(order) > 0:
            i = order[0]
            keep.append(int(i))

            if len(order) == 1:
                break

            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])

            inter = np.maximum(0.0, xx2 - xx1) * np.maximum(0.0, yy2 - yy1)
            iou = inter / (areas[i] + areas[order[1:]] - inter)

            remaining = np.where(iou <= iou_threshold)[0]
            order = order[remaining + 1]

        return np.array(keep, dtype=np.intp)

    def configure(self, **kwargs: Any) -> None:
        self.min_score = kwargs.pop("minScore", self.min_score)
