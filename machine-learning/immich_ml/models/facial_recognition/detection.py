from typing import Any

import cv2
import numpy as np
from insightface.model_zoo import RetinaFace
from numpy.typing import NDArray

from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2
from immich_ml.schemas import FaceDetectionOutput, ModelSession, ModelTask, ModelType


class FaceDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)

    def __init__(self, model_name: str, min_score: float = 0.7, **model_kwargs: Any) -> None:
        self.min_score = model_kwargs.pop("minScore", min_score)
        # 对“大脸/贴边脸”场景做兜底：当首轮检测无结果时，对图像做 padding 再检测。
        # 这不依赖模型是否支持动态 det_size（即使 ONNX 是固定 640x640 也有效）。
        self.fallback_pad_ratio = float(model_kwargs.pop("fallbackPadRatio", 0.25))
        super().__init__(model_name, **model_kwargs)

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        self.model = RetinaFace(session=session)
        self.model.prepare(ctx_id=0, det_thresh=self.min_score, input_size=(640, 640))

        return session

    def _predict(self, inputs: NDArray[np.uint8] | bytes) -> FaceDetectionOutput:
        img = decode_cv2(inputs)
        bboxes, landmarks = self._detect(img)
        if landmarks is None or bboxes.shape[0] == 0:
            # 人脸识别依赖关键点进行对齐裁剪；无关键点时返回空结果比输出错误 embedding 更安全。
            return {
                "boxes": np.zeros((0, 4), dtype=np.float32),
                "scores": np.zeros((0,), dtype=np.float32),
                "landmarks": np.zeros((0, 5, 2), dtype=np.float32),
            }
        return {
            "boxes": bboxes[:, :4].round(),
            "scores": bboxes[:, 4],
            "landmarks": landmarks,
        }

    def _detect(self, img: NDArray[np.uint8]) -> tuple[NDArray[np.float32], NDArray[np.float32] | None]:
        bboxes, landmarks = self.model.detect(img)  # type: ignore
        if bboxes.shape[0] > 0:
            return bboxes, landmarks

        # 首轮无检测结果时，尝试对图像加边框后再检测，以降低“大脸”相对尺度。
        if self.fallback_pad_ratio <= 0:
            return bboxes, landmarks

        padded, (pad_top, pad_left) = self._pad_image(img, self.fallback_pad_ratio)
        bboxes2, landmarks2 = self.model.detect(padded)  # type: ignore
        if bboxes2.shape[0] == 0:
            return bboxes, landmarks

        # 将 padded 坐标系映射回原图坐标系。
        bboxes2 = bboxes2.copy()
        bboxes2[:, 0] -= pad_left
        bboxes2[:, 2] -= pad_left
        bboxes2[:, 1] -= pad_top
        bboxes2[:, 3] -= pad_top

        if landmarks2 is not None:
            landmarks2 = landmarks2.copy()
            landmarks2[:, :, 0] -= pad_left
            landmarks2[:, :, 1] -= pad_top

        return bboxes2, landmarks2

    @staticmethod
    def _pad_image(img: NDArray[np.uint8], pad_ratio: float) -> tuple[NDArray[np.uint8], tuple[int, int]]:
        """给图像四周增加 padding，用于改善超大脸/贴边脸的检测稳定性。"""
        h, w = img.shape[:2]
        pad = int(round(max(h, w) * pad_ratio))
        pad = max(pad, 1)
        # 使用反射边界减少纯黑 padding 对检测的干扰。
        padded = cv2.copyMakeBorder(img, pad, pad, pad, pad, borderType=cv2.BORDER_REFLECT_101)
        return np.asarray(padded, dtype=np.uint8), (pad, pad)

    def configure(self, **kwargs: Any) -> None:
        self.model.det_thresh = kwargs.pop("minScore", self.model.det_thresh)
        if (pad_ratio := kwargs.pop("fallbackPadRatio", None)) is not None:
            self.fallback_pad_ratio = float(pad_ratio)
