from functools import cached_property
from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from rapidocr.inference_engine.base import FileInfo, InferSession
from rapidocr.utils.download_file import DownloadFile, DownloadFileInput
from rapidocr.utils.typings import EngineType, LangDet, OCRVersion, TaskType
from rapidocr.utils.typings import ModelType as RapidModelType

from immich_ml.config import log
from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelFormat, ModelSession, ModelTask, ModelType
from immich_ml.sessions.ort import OrtSession

from .postprocess import DBPostProcess
from .schemas import TextDetectionOutput


class TextDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.OCR)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        super().__init__(model_name, **model_kwargs, model_format=ModelFormat.ONNX)
        self.scale = np.float32(1.0 / 127.5)  # (x/255 - 0.5) / 0.5
        self._empty: TextDetectionOutput = {
            "boxes": np.empty(0, dtype=np.float32),
            "scores": np.empty(0, dtype=np.float32),
        }
        self.postprocess = DBPostProcess(thresh=0.3, max_candidates=1000, unclip_ratio=1.6, use_dilation=True)

    def _download(self) -> None:
        model_info = InferSession.get_model_url(
            FileInfo(
                engine_type=EngineType.ONNXRUNTIME,
                ocr_version=OCRVersion.PPOCRV5,
                task_type=TaskType.DET,
                lang_type=LangDet.CH,
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
        # TODO: support other runtime sessions
        return OrtSession(self.model_path)

    def _predict(
        self, inputs: Image.Image, maxResolution: int = 736, minScore: float = 0.5, scoreMode: str = "fast"
    ) -> TextDetectionOutput:
        width, height = inputs.size
        if width < 32 or height < 32:
            return self._empty

        image, content = self._transform(inputs, maxResolution)
        input_name = self.session.get_inputs()[0].name
        probs = self.session.run(None, {input_name: image})[0][0]
        if probs.ndim == 3:
            probs = probs[0]
        boxes, scores = self.postprocess(probs[: content[0], : content[1]], (height, width), minScore, scoreMode)
        if len(boxes) == 0:
            return self._empty
        order = self.reading_order(boxes)
        return {"boxes": boxes[order], "scores": scores[order]}

    @cached_property
    def raw_input(self) -> bool:
        return self.session.get_inputs()[0].shape[-1] == 3  # NHWC models handle normalization and transpose internally

    def _transform(self, img: Image.Image, max_resolution: int) -> tuple[NDArray[Any], tuple[int, int]]:
        ratio = min(max_resolution / min(img.height, img.width), 1.0)
        resize_h = max(self._round32(img.height * ratio), 32)
        resize_w = max(self._round32(img.width * ratio), 32)
        resized = img.resize((resize_w, resize_h), resample=Image.Resampling.LANCZOS)
        if resized.mode != "RGB":
            resized = resized.convert("RGB")
        array = np.asarray(resized)
        if self.raw_input:
            return array[None], (resize_h, resize_w)
        # reverse plane order gets the BGR swap and the CHW transpose for free
        out = np.empty((1, 3, resize_h, resize_w), dtype=np.float32)
        for channel in range(3):
            plane = out[0, 2 - channel]
            np.multiply(array[:, :, channel], self.scale, out=plane)
            plane -= 1.0
        return out, (resize_h, resize_w)

    @staticmethod
    def _round32(value: float) -> int:
        return int(round(value / 32) * 32)

    def reading_order(self, boxes: NDArray[np.float32]) -> NDArray[np.intp]:
        """Indices of `boxes` top to bottom, then left to right within a line."""
        y_order = np.argsort(boxes[:, 0, 1], kind="stable")
        lines = np.zeros(len(boxes), dtype=np.int32)  # indexed in y-sorted order, not box order
        np.cumsum(np.diff(boxes[y_order, 0, 1]) >= 10, out=lines[1:])  # ascending, so the diffs are already positive
        order: NDArray[np.intp] = y_order[np.argsort(lines * 1e6 + boxes[y_order, 0, 0], kind="stable")]
        return order
