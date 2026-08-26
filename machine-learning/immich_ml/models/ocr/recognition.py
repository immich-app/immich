import math
from functools import cached_property
from typing import Any

import cv2
import numpy as np
from numpy.typing import NDArray
from PIL import Image
from rapidocr import LangRec
from rapidocr.inference_engine.base import FileInfo, InferSession
from rapidocr.utils.download_file import DownloadFile, DownloadFileInput
from rapidocr.utils.typings import EngineType, OCRVersion, TaskType
from rapidocr.utils.typings import ModelType as RapidModelType

from immich_ml.config import log, settings
from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelFormat, ModelSession, ModelTask, ModelType
from immich_ml.sessions.ort import OrtSession

from .ctc import CtcDecoder, greedy
from .schemas import TextDetectionOutput, TextRecognitionOutput

REC_HEIGHT = 48
REC_BASE_RATIO = 320 / REC_HEIGHT  # PP-OCR's rec_image_shape floor
SCALE = np.float32(1.0 / 127.5)


class TextRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.OCR)]
    identity = (ModelType.RECOGNITION, ModelTask.OCR)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        self.language = LangRec[model_name.split("__")[0]] if "__" in model_name else LangRec.CH
        self._empty: TextRecognitionOutput = {
            "box": np.empty(0, dtype=np.float32),
            "boxScore": np.empty(0, dtype=np.float32),
            "text": [],
            "textScore": np.empty(0, dtype=np.float32),
        }
        super().__init__(model_name, **model_kwargs, model_format=ModelFormat.ONNX)
        max_batch_size = settings.max_batch_size and settings.max_batch_size.ocr
        self.batch_size = max_batch_size if max_batch_size else 6

    def _download(self) -> None:
        model_info = InferSession.get_model_url(
            FileInfo(
                engine_type=EngineType.ONNXRUNTIME,
                ocr_version=OCRVersion.PPOCRV5,
                task_type=TaskType.REC,
                lang_type=self.language,
                model_type=RapidModelType.MOBILE if "mobile" in self.model_name else RapidModelType.SERVER,
            )
        )
        download_params = DownloadFileInput(
            file_url=model_info["model_dir"],
            sha256=model_info["SHA256"],
            save_path=self.model_path,
            logger=log,
        )
        DownloadFile.run(download_params)

    def _load(self) -> ModelSession:
        # TODO: support other runtimes
        session = OrtSession(self.model_path)
        self.decoder = (
            CtcDecoder(character.splitlines())
            if (character := session.get_metadata().get("character")) is not None
            else CtcDecoder.from_file(self.model_dir / "charset.txt")
        )
        return session

    @cached_property
    def raw_input(self) -> bool:
        return self.session.get_inputs()[0].shape[-1] == 3  # NHWC models handle normalization and transpose internally

    def _predict(self, img: Image.Image, texts: TextDetectionOutput, minScore: float = 0.9) -> TextRecognitionOutput:
        boxes, box_scores = texts["boxes"], texts["scores"]
        if boxes.shape[0] == 0:
            return self._empty

        widths, heights, coeffs = self._crop_geometry(boxes)
        upright = heights * 2 >= widths * 3  # PP-OCR stands a crop up when it is 1.5x taller than it is wide
        ratios = np.where(upright, heights / widths, widths / heights)
        order = np.argsort(ratios)  # group similar widths so each batch pads the least it can

        text_list: list[str] = [""] * len(order)
        score_list = np.zeros(len(order), dtype=np.float32)
        input_name = self.session.get_inputs()[0].name
        for start in range(0, len(order), self.batch_size):
            chunk = order[start : start + self.batch_size]
            width = int(REC_HEIGHT * max(REC_BASE_RATIO, ratios[chunk[-1]]))
            images: NDArray[Any] = (
                np.full((len(chunk), REC_HEIGHT, width, 3), 127, dtype=np.uint8)
                if self.raw_input
                else np.zeros((len(chunk), 3, REC_HEIGHT, width), dtype=np.float32)
            )
            for i, index in enumerate(chunk):
                crop = self._crop(img, coeffs[index], widths[index], heights[index], upright[index])
                resized_w = max(1, min(width, math.ceil(REC_HEIGHT * ratios[index])))
                if self.raw_input:
                    cv2.resize(crop, (resized_w, REC_HEIGHT), dst=images[i, :, :resized_w])
                    continue
                resized = cv2.resize(crop, (resized_w, REC_HEIGHT))
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

    def _crop_geometry(
        self, boxes: NDArray[np.float32]
    ) -> tuple[NDArray[np.int32], NDArray[np.int32], NDArray[np.float32]]:
        """Upright crop size for each box, and the perspective coefficients that map the box onto it."""
        widths = np.maximum(
            np.linalg.norm(boxes[:, 1] - boxes[:, 0], axis=1), np.linalg.norm(boxes[:, 2] - boxes[:, 3], axis=1)
        ).astype(np.int32)
        heights = np.maximum(
            np.linalg.norm(boxes[:, 0] - boxes[:, 3], axis=1), np.linalg.norm(boxes[:, 1] - boxes[:, 2], axis=1)
        ).astype(np.int32)
        pts_std = np.zeros((len(boxes), 4, 2), dtype=np.float32)
        pts_std[:, 1:3, 0] = widths[:, None]
        pts_std[:, 2:4, 1] = heights[:, None]
        return widths, heights, self._get_perspective_transform(pts_std, boxes)

    def _crop(
        self, img: Image.Image, coeffs: NDArray[np.float32], width: int, height: int, upright: bool
    ) -> NDArray[np.uint8]:
        crop = img.transform(
            size=(width, height),
            method=Image.Transform.PERSPECTIVE,
            data=coeffs.tolist(),
            resample=Image.Resampling.BICUBIC,
        )
        return np.asarray(crop.rotate(90, expand=True) if upright else crop)

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
