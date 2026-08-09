import math
from typing import Any

import cv2
import numpy as np
from numpy.typing import NDArray
from PIL import Image

from immich_ml.config import settings
from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelFormat, ModelSession, ModelTask, ModelType

from .ctc import CtcDecoder, greedy
from .schemas import TextDetectionOutput, TextRecognitionOutput

REC_HEIGHT = 48
REC_BASE_RATIO = 320 / REC_HEIGHT  # PP-OCR's rec_image_shape floor
SCALE = np.float32(1.0 / 127.5)


class TextRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.OCR)]
    identity = (ModelType.RECOGNITION, ModelTask.OCR)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        self._empty: TextRecognitionOutput = {
            "box": np.empty(0, dtype=np.float32),
            "boxScore": np.empty(0, dtype=np.float32),
            "text": [],
            "textScore": np.empty(0, dtype=np.float32),
        }
        super().__init__(model_name, **model_kwargs, model_format=ModelFormat.ONNX)
        max_batch_size = settings.max_batch_size and settings.max_batch_size.ocr
        self.batch_size = max_batch_size if max_batch_size else 6

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        self.decoder = (
            CtcDecoder(character.splitlines())
            if (character := session.get_metadata().get("character")) is not None
            else CtcDecoder.from_file(self.model_dir / "charset.txt")
        )
        return session

    def _predict(self, img: Image.Image, texts: TextDetectionOutput, minScore: float = 0.9) -> TextRecognitionOutput:
        boxes, box_scores = texts["boxes"], texts["scores"]
        if boxes.shape[0] == 0:
            return self._empty

        crops = self.get_crop_img_list(img, boxes)
        text_list: list[str] = [""] * len(crops)
        score_list = np.zeros(len(crops), dtype=np.float32)
        ratios = [crop.shape[1] / crop.shape[0] for crop in crops]
        order = np.argsort(ratios)  # group similar widths so each batch pads the least it can

        input_name = self.session.get_inputs()[0].name
        for start in range(0, len(order), self.batch_size):
            chunk = order[start : start + self.batch_size]
            width = int(REC_HEIGHT * max(REC_BASE_RATIO, ratios[chunk[-1]]))
            images = np.zeros((len(chunk), 3, REC_HEIGHT, width), dtype=np.float32)
            for i, index in enumerate(chunk):
                resized_w = max(1, min(width, math.ceil(REC_HEIGHT * ratios[index])))
                resized = cv2.resize(crops[index], (resized_w, REC_HEIGHT))
                view = images[i, :, :, :resized_w]
                np.multiply(resized.transpose(2, 0, 1)[::-1], SCALE, out=view)  # [::-1] is the RGB -> BGR swap
                view -= 1.0

            out_indices, out_probs = greedy(self.session.run(None, {input_name: images}))
            chunk_texts, chunk_scores = self.decoder.decode(out_indices, out_probs)
            for index, text, score in zip(chunk, chunk_texts, chunk_scores):
                text_list[index] = text
                score_list[index] = score

        boxes[:, :, 0] /= img.width
        boxes[:, :, 1] /= img.height

        valid = score_list > minScore
        valid_list = valid.tolist()
        return {
            "box": boxes.reshape(-1, 8)[valid].reshape(-1),
            "text": [text for text, keep in zip(text_list, valid_list) if keep],
            "boxScore": box_scores[valid],
            "textScore": score_list[valid],
        }

    def get_crop_img_list(self, img: Image.Image, boxes: NDArray[np.float32]) -> list[NDArray[np.uint8]]:
        img_crop_width = np.maximum(
            np.linalg.norm(boxes[:, 1] - boxes[:, 0], axis=1), np.linalg.norm(boxes[:, 2] - boxes[:, 3], axis=1)
        ).astype(np.int32)
        img_crop_height = np.maximum(
            np.linalg.norm(boxes[:, 0] - boxes[:, 3], axis=1), np.linalg.norm(boxes[:, 1] - boxes[:, 2], axis=1)
        ).astype(np.int32)
        pts_std = np.zeros((img_crop_width.shape[0], 4, 2), dtype=np.float32)
        pts_std[:, 1:3, 0] = img_crop_width[:, None]
        pts_std[:, 2:4, 1] = img_crop_height[:, None]

        img_crop_sizes = np.stack([img_crop_width, img_crop_height], axis=1)
        all_coeffs = self._get_perspective_transform(pts_std, boxes)
        imgs: list[NDArray[np.uint8]] = []
        for coeffs, dst_size in zip(all_coeffs, img_crop_sizes):
            dst_img = img.transform(
                size=tuple(dst_size),
                method=Image.Transform.PERSPECTIVE,
                data=tuple(coeffs),
                resample=Image.Resampling.BICUBIC,
            )

            dst_width, dst_height = dst_img.size
            if dst_height * 1.0 / dst_width >= 1.5:
                dst_img = dst_img.rotate(90, expand=True)
            imgs.append(np.asarray(dst_img))

        return imgs

    def _get_perspective_transform(self, src: NDArray[np.float32], dst: NDArray[np.float32]) -> NDArray[np.float32]:
        N = src.shape[0]
        x, y = src[:, :, 0], src[:, :, 1]
        u, v = dst[:, :, 0], dst[:, :, 1]
        A = np.zeros((N, 8, 8), dtype=np.float32)
        b = np.empty((N, 8, 1), dtype=np.float32)

        # even rows [x, y, 1, 0, 0, 0, -u*x, -u*y] = u; odd [0, 0, 0, x, y, 1, -v*x, -v*y] = v
        A[:, ::2, 0] = x
        A[:, ::2, 1] = y
        A[:, ::2, 2] = 1
        A[:, ::2, 6] = -u * x
        A[:, ::2, 7] = -u * y
        b[:, ::2, 0] = u

        A[:, 1::2, 3] = x
        A[:, 1::2, 4] = y
        A[:, 1::2, 5] = 1
        A[:, 1::2, 6] = -v * x
        A[:, 1::2, 7] = -v * y
        b[:, 1::2, 0] = v

        # h22 is fixed at 1, so this is a determined system rather than a null space
        coeffs: NDArray[np.float32] = np.linalg.solve(A, b)[:, :, 0]
        return coeffs
