from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from rapidocr.ch_ppocr_det import TextDetector as RapidTextDetector
from rapidocr.ch_ppocr_det.utils import DBPostProcess
from rapidocr.inference_engine.base import FileInfo, InferSession
from rapidocr.utils import DownloadFile, DownloadFileInput
from rapidocr.utils.typings import EngineType, LangDet, OCRVersion, TaskType
from rapidocr.utils.typings import ModelType as RapidModelType

from immich_ml.config import log
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import pil_to_cv2
from immich_ml.schemas import ModelFormat, ModelSession, ModelTask, ModelType
from immich_ml.sessions.ort import OrtSession

from .schemas import TextDetectionOutput


class TextDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.OCR)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        super().__init__(model_name, **model_kwargs, model_format=ModelFormat.ONNX)
        self.max_resolution = 736
        self.mean = np.array([0.5, 0.5, 0.5], dtype=np.float32)
        self.std = np.array([0.5, 0.5, 0.5], dtype=np.float32) * 255.0
        self._empty: TextDetectionOutput = {
            "boxes": np.empty(0, dtype=np.float32),
            "scores": np.empty(0, dtype=np.float32),
        }
        self.postprocess = DBPostProcess(
            thresh=0.3,
            box_thresh=model_kwargs.get("minScore", 0.5),
            max_candidates=1000,
            unclip_ratio=1.6,
            use_dilation=True,
            score_mode="fast",
        )

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
        return OrtSession(self.model_path, providers=["CPUExecutionProvider"])

    # partly adapted from RapidOCR
    def _predict(self, inputs: Image.Image) -> TextDetectionOutput:
        w, h = inputs.size
        if w < 32 or h < 32:
            return self._empty
        out = self.session.run(None, {"x": self._transform(inputs)})[0]
        boxes, scores = self.postprocess(out, (h, w))
        if len(boxes) == 0:
            return self._empty
        return {
            "boxes": np.array(RapidTextDetector.sorted_boxes(boxes), dtype=np.float32),
            "scores": np.array(scores, dtype=np.float32),
        }

    # adapted from RapidOCR
    def _transform(self, img: Image.Image) -> NDArray[np.float32]:
        if img.height < img.width:
            ratio = float(self.max_resolution) / img.height
        else:
            ratio = float(self.max_resolution) / img.width

        resize_h = int(img.height * ratio)
        resize_w = int(img.width * ratio)

        resize_h = int(round(resize_h / 32) * 32)
        resize_w = int(round(resize_w / 32) * 32)
        resized_img = img.resize((int(resize_w), int(resize_h)), resample=Image.Resampling.BICUBIC)

        normalized_img = (pil_to_cv2(resized_img) - self.mean) / self.std
        normalized_img = np.transpose(normalized_img, (2, 0, 1))
        return np.expand_dims(normalized_img, axis=0)

    def configure(self, **kwargs: Any) -> None:
        if (max_resolution := kwargs.get("maxResolution")) is not None:
            self.max_resolution = max_resolution
        if (min_score := kwargs.get("minScore")) is not None:
            self.postprocess.box_thresh = min_score
        if (score_mode := kwargs.get("scoreMode")) is not None:
            self.postprocess.score_mode = score_mode
