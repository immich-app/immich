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
from immich_ml.schemas import ModelFormat, ModelSession, ModelTask, ModelType
from immich_ml.sessions.ort import OrtSession

from .schemas import OcrOptions, TextDetectionOutput


class TextDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.OCR)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        super().__init__(model_name, **model_kwargs, model_format=ModelFormat.ONNX)
        self.max_resolution = 736
        self.min_score = 0.5
        self.score_mode = "fast"
        self._empty: TextDetectionOutput = {
            "image": np.empty(0, dtype=np.float32),
            "boxes": np.empty(0, dtype=np.float32),
            "scores": np.empty(0, dtype=np.float32),
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
        # TODO: support other runtime sessions
        session = OrtSession(self.model_path)
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

    def _predict(self, inputs: bytes | Image.Image) -> TextDetectionOutput:
        results = self.model(decode_cv2(inputs))
        if results.boxes is None or results.scores is None or results.img is None:
            return self._empty
        return {
            "image": results.img,
            "boxes": np.array(results.boxes, dtype=np.float32),
            "scores": np.array(results.scores, dtype=np.float32),
        }

    def configure(self, **kwargs: Any) -> None:
        if (max_resolution := kwargs.get("maxResolution")) is not None:
            self.max_resolution = max_resolution
            self.model.limit_side_len = max_resolution
        if (min_score := kwargs.get("minScore")) is not None:
            self.min_score = min_score
            self.model.postprocess_op.box_thresh = min_score
        if (score_mode := kwargs.get("scoreMode")) is not None:
            self.score_mode = score_mode
            self.model.postprocess_op.score_mode = score_mode
