from typing import Any

import cv2
import numpy as np
from PIL.Image import Image
from rapidocr.ch_ppocr_rec import TextRecInput
from rapidocr.ch_ppocr_rec import TextRecognizer as RapidTextRecognizer
from rapidocr.inference_engine.base import FileInfo, InferSession
from rapidocr.utils import DownloadFile, DownloadFileInput
from rapidocr.utils.typings import EngineType, LangDet, OCRVersion, TaskType
from rapidocr.utils.typings import ModelType as RapidModelType

from immich_ml.config import log, settings
from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelFormat, ModelSession, ModelTask, ModelType
from immich_ml.sessions.ort import OrtSession

from .schemas import OcrOptions, TextDetectionOutput, TextRecognitionOutput


class TextRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.OCR)]
    identity = (ModelType.RECOGNITION, ModelTask.OCR)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        self.min_score = model_kwargs.get("minScore", 0.5)
        self._empty: TextRecognitionOutput = {
            "box": np.empty(0, dtype=np.float32),
            "boxScore": [],
            "text": [],
            "textScore": [],
        }
        super().__init__(model_name, **model_kwargs, model_format=ModelFormat.ONNX)

    def _download(self) -> None:
        model_info = InferSession.get_model_url(
            FileInfo(
                engine_type=EngineType.ONNXRUNTIME,
                ocr_version=OCRVersion.PPOCRV5,
                task_type=TaskType.REC,
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
        # TODO: support other runtimes
        session = OrtSession(self.model_path)
        self.model = RapidTextRecognizer(
            OcrOptions(
                session=session.session,
                rec_batch_num=settings.max_batch_size.text_recognition if settings.max_batch_size is not None else 6,
                rec_img_shape=(3, 48, 320),
            )
        )
        return session

    def configure(self, **kwargs: Any) -> None:
        self.min_score = kwargs.get("minScore", self.min_score)

    def _predict(self, _: Image, texts: TextDetectionOutput, **kwargs: Any) -> TextRecognitionOutput:
        boxes, resized_img, box_scores = texts["boxes"], texts["resized"], texts["scores"]
        if boxes.shape[0] == 0:
            return self._empty
        rec = self.model(TextRecInput(img=self.get_crop_img_list(resized_img, boxes)))
        if rec.txts is None:
            return self._empty

        height, width = resized_img.shape[0:2]
        log.info(f"Image shape: width={width}, height={height}")
        boxes[:, :, 0] /= width
        boxes[:, :, 1] /= height

        text_scores = np.array(rec.scores)
        valid_text_score_idx = text_scores > 0.5
        valid_score_idx_list = valid_text_score_idx.tolist()
        return {
            "box": boxes.reshape(-1, 8)[valid_text_score_idx].reshape(-1),
            "text": [rec.txts[i] for i in range(len(rec.txts)) if valid_score_idx_list[i]],
            "boxScore": box_scores[valid_text_score_idx],
            "textScore": text_scores[valid_text_score_idx],
        }

    def get_crop_img_list(self, img: np.ndarray, boxes: np.ndarray) -> list[np.ndarray]:
        img_crop_width = np.maximum(
            np.linalg.norm(boxes[:, 1] - boxes[:, 0], axis=1), np.linalg.norm(boxes[:, 2] - boxes[:, 3], axis=1)
        ).astype(np.int32)
        img_crop_height = np.maximum(
            np.linalg.norm(boxes[:, 0] - boxes[:, 3], axis=1), np.linalg.norm(boxes[:, 1] - boxes[:, 2], axis=1)
        ).astype(np.int32)
        pts_std = np.zeros((img_crop_width.shape[0], 4, 2), dtype=np.float32)
        pts_std[:, 1:3, 0] = img_crop_width[:, None]
        pts_std[:, 2:4, 1] = img_crop_height[:, None]

        img_crop_sizes = np.stack([img_crop_width, img_crop_height], axis=1).tolist()
        imgs = []
        for box, pts_std, dst_size in zip(list(boxes), list(pts_std), img_crop_sizes):
            M = cv2.getPerspectiveTransform(box, pts_std)
            dst_img = cv2.warpPerspective(
                img,
                M,
                dst_size,
                borderMode=cv2.BORDER_REPLICATE,
                flags=cv2.INTER_CUBIC,
            )
            dst_height, dst_width = dst_img.shape[0:2]
            if dst_height * 1.0 / dst_width >= 1.5:
                dst_img = np.rot90(dst_img)
            imgs.append(dst_img)
        return imgs
