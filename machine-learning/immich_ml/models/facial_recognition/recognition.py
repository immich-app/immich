from pathlib import Path
from typing import Any

import cv2
import numpy as np
import onnx
import onnxruntime as ort
from insightface.model_zoo import ArcFaceONNX
from insightface.utils.face_align import norm_crop
from numpy.typing import NDArray
from onnx.tools.update_model_dims import update_inputs_outputs_dims
from PIL import Image

from immich_ml.config import log, settings
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2, serialize_np_array
from immich_ml.schemas import (
    FaceDetectionOutput,
    FacialRecognitionOutput,
    ModelFormat,
    ModelSession,
    ModelTask,
    ModelType,
)


class FaceRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)]
    identity = (ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        # 对齐裁剪兜底：当关键点过于贴边或超出图像边界时，先对整张图做 padding 再裁剪。
        # 该逻辑主要用于“超大脸/贴边脸”，避免 cv2.warpAffine 采样到大量黑边导致 embedding 质量变差。
        self.crop_margin_ratio = float(model_kwargs.pop("cropMarginRatio", 0.5))
        self.max_crop_pad_ratio = float(model_kwargs.pop("maxCropPadRatio", 0.5))
        super().__init__(model_name, **model_kwargs)
        max_batch_size = settings.max_batch_size.facial_recognition if settings.max_batch_size else None
        self.batch_size = max_batch_size if max_batch_size else self._batch_size_default

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        if (not self.batch_size or self.batch_size > 1) and str(session.get_inputs()[0].shape[0]) != "batch":
            self._add_batch_axis(self.model_path)
            session = self._make_session(self.model_path)
        self.model = ArcFaceONNX(
            self.model_path_for_format(ModelFormat.ONNX).as_posix(),
            session=session,
        )
        return session

    def configure(self, **kwargs: Any) -> None:
        if (margin_ratio := kwargs.pop("cropMarginRatio", None)) is not None:
            self.crop_margin_ratio = float(margin_ratio)
        if (max_pad_ratio := kwargs.pop("maxCropPadRatio", None)) is not None:
            self.max_crop_pad_ratio = float(max_pad_ratio)

    def _predict(
        self, inputs: NDArray[np.uint8] | bytes | Image.Image, faces: FaceDetectionOutput
    ) -> FacialRecognitionOutput:
        if faces["boxes"].shape[0] == 0:
            return []
        inputs = decode_cv2(inputs)
        cropped_faces = self._crop(inputs, faces)
        embeddings = self._predict_batch(cropped_faces)
        return self.postprocess(faces, embeddings)

    def _predict_batch(self, cropped_faces: list[NDArray[np.uint8]]) -> NDArray[np.float32]:
        if not self.batch_size or len(cropped_faces) <= self.batch_size:
            embeddings = np.asarray(self.model.get_feat(cropped_faces), dtype=np.float32)
            return embeddings

        batch_embeddings: list[NDArray[np.float32]] = []
        for i in range(0, len(cropped_faces), self.batch_size):
            batch = cropped_faces[i : i + self.batch_size]
            batch_embeddings.append(np.asarray(self.model.get_feat(batch), dtype=np.float32))
        return np.concatenate(batch_embeddings, axis=0)

    def postprocess(self, faces: FaceDetectionOutput, embeddings: NDArray[np.float32]) -> FacialRecognitionOutput:
        return [
            {
                "boundingBox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "embedding": serialize_np_array(embedding),
                "score": score,
            }
            for (x1, y1, x2, y2), embedding, score in zip(faces["boxes"], embeddings, faces["scores"])
        ]

    def _crop(self, image: NDArray[np.uint8], faces: FaceDetectionOutput) -> list[NDArray[np.uint8]]:
        landmarks = faces["landmarks"].astype(np.float32, copy=False)
        pad = self._compute_crop_pad(image, landmarks, self.crop_margin_ratio, self.max_crop_pad_ratio)
        if pad > 0:
            # 使用反射边界，避免纯黑 padding 影响对齐后的人脸纹理。
            padded = cv2.copyMakeBorder(image, pad, pad, pad, pad, borderType=cv2.BORDER_REFLECT_101)
            padded = np.asarray(padded, dtype=np.uint8)
            landmarks = landmarks + np.array([pad, pad], dtype=np.float32)
            return [norm_crop(padded, landmark) for landmark in landmarks]
        return [norm_crop(image, landmark) for landmark in landmarks]

    @staticmethod
    def _compute_crop_pad(
        image: NDArray[np.uint8],
        landmarks: NDArray[np.float32],
        margin_ratio: float,
        max_pad_ratio: float,
    ) -> int:
        """根据关键点和期望边距计算需要的 padding 像素数。"""
        h, w = image.shape[:2]
        if landmarks.size == 0:
            return 0

        # 逐脸计算“关键点包围盒 + 边距”是否会超出图像边界，并取最大需要的 padding。
        max_needed = 0.0
        for lmk in landmarks:
            min_x = float(np.min(lmk[:, 0]))
            min_y = float(np.min(lmk[:, 1]))
            max_x = float(np.max(lmk[:, 0]))
            max_y = float(np.max(lmk[:, 1]))
            face_size = max(max_x - min_x, max_y - min_y, 1.0)
            margin = face_size * max(margin_ratio, 0.0)

            left_needed = max(0.0, (margin - min_x))
            top_needed = max(0.0, (margin - min_y))
            right_needed = max(0.0, (max_x + margin) - float(w - 1))
            bottom_needed = max(0.0, (max_y + margin) - float(h - 1))
            max_needed = max(max_needed, left_needed, top_needed, right_needed, bottom_needed)

        # 限制 padding 上限，避免异常关键点导致内存暴涨。
        max_allowed = max(h, w) * max(max_pad_ratio, 0.0)
        pad = int(round(min(max_needed, max_allowed)))
        return max(pad, 0)

    def _add_batch_axis(self, model_path: Path) -> None:
        log.debug(f"Adding batch axis to model {model_path}")
        proto = onnx.load(model_path)
        static_input_dims = [shape.dim_value for shape in proto.graph.input[0].type.tensor_type.shape.dim[1:]]
        static_output_dims = [shape.dim_value for shape in proto.graph.output[0].type.tensor_type.shape.dim[1:]]
        input_dims = {proto.graph.input[0].name: ["batch"] + static_input_dims}
        output_dims = {proto.graph.output[0].name: ["batch"] + static_output_dims}
        updated_proto = update_inputs_outputs_dims(proto, input_dims, output_dims)
        onnx.save(updated_proto, model_path)

    @property
    def _batch_size_default(self) -> int | None:
        providers = ort.get_available_providers()
        return None if self.model_format == ModelFormat.ONNX and "OpenVINOExecutionProvider" not in providers else 1
