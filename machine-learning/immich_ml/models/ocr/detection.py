from typing import Any

import numpy as np
from PIL import Image
from rapidocr.ch_ppocr_det import TextDetector as RapidTextDetector
from rapidocr.inference_engine.base import FileInfo, InferSession
from rapidocr.utils import DownloadFile, DownloadFileInput
from rapidocr.utils.typings import EngineType, LangDet, OCRVersion, TaskType
from rapidocr.utils.typings import ModelType as RapidModelType

from immich_ml.config import log
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2
from immich_ml.schemas import ModelSession, ModelTask, ModelType

from .schemas import OcrOptions, TextDetectionOutput


class TextDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.OCR)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        super().__init__(model_name, **model_kwargs)
        self.max_resolution = 1440
        self.min_score = 0.5
        self.score_mode = "fast"
        self._empty: TextDetectionOutput = {
            "resized": np.empty(0, dtype=np.float32),
            "boxes": np.empty(0, dtype=np.float32),
            "scores": (),
        }

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
        session = self._make_session(self.model_path)
        self.model = RapidTextDetector(
            OcrOptions(
                session=session.session,
                limit_side_len=self.max_resolution,
                limit_type="min",
                box_thresh=self.min_score,
                score_mode=self.score_mode,
            )
        )
        return session

    def configure(self, **kwargs: Any) -> None:
        self.max_resolution = kwargs.get("maxResolution", self.max_resolution)
        self.min_score = kwargs.get("minScore", self.min_score)
        self.score_mode = kwargs.get("scoreMode", self.score_mode)

    def _predict(self, inputs: bytes | Image.Image, **kwargs: Any) -> TextDetectionOutput:
        results = self.model(decode_cv2(inputs))
        if results.boxes is None or results.scores is None or results.img is None:
            return self._empty
        log.info(f"{results.boxes=}, {results.scores=}")
        return {
            "resized": results.img,
            "boxes": np.array(results.boxes, dtype=np.float32),
            "scores": np.array(results.scores, dtype=np.float32),
        }
