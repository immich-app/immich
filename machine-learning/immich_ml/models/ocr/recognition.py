from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from rapidocr.ch_ppocr_rec import TextRecInput
from rapidocr.ch_ppocr_rec import TextRecognizer as RapidTextRecognizer
from rapidocr.inference_engine.base import FileInfo, InferSession
from rapidocr.utils.download_file import DownloadFile, DownloadFileInput
from rapidocr.utils.typings import EngineType, LangRec, OCRVersion, TaskType
from rapidocr.utils.typings import ModelType as RapidModelType
from rapidocr.utils.vis_res import VisRes

from immich_ml.config import log, settings
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import pil_to_cv2
from immich_ml.schemas import ModelFormat, ModelSession, ModelTask, ModelType
from immich_ml.sessions.ort import OrtSession

from .schemas import OcrOptions, TextDetectionOutput, TextRecognitionOutput


class TextRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.OCR)]
    identity = (ModelType.RECOGNITION, ModelTask.OCR)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        self.language = LangRec[model_name.split("__")[0]] if "__" in model_name else LangRec.CH
        self.min_score = model_kwargs.get("minScore", 0.9)
        self._empty: TextRecognitionOutput = {
            "box": np.empty(0, dtype=np.float32),
            "boxScore": np.empty(0, dtype=np.float32),
            "text": [],
            "textScore": np.empty(0, dtype=np.float32),
        }
        VisRes.__init__ = lambda self, **kwargs: None  # pyright: ignore[reportAttributeAccessIssue]
        super().__init__(model_name, **model_kwargs, model_format=ModelFormat.ONNX)

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
        self.model = RapidTextRecognizer(
            OcrOptions(
                session=session.session,
                rec_batch_num=settings.max_batch_size.text_recognition if settings.max_batch_size is not None else 6,
                rec_img_shape=(3, 48, 320),
                lang_type=self.language,
            )
        )
        return session

    def _predict(self, img: Image.Image, texts: TextDetectionOutput) -> TextRecognitionOutput:
        boxes, box_scores = texts["boxes"], texts["scores"]
        if boxes.shape[0] == 0:
            return self._empty
        rec = self.model(TextRecInput(img=self.get_crop_img_list(img, boxes)))
        if rec.txts is None:
            return self._empty

        boxes[:, :, 0] /= img.width
        boxes[:, :, 1] /= img.height

        text_scores = np.array(rec.scores)
        valid_text_score_idx = text_scores > self.min_score
        valid_score_idx_list = valid_text_score_idx.tolist()
        return {
            "box": boxes.reshape(-1, 8)[valid_text_score_idx].reshape(-1),
            "text": [rec.txts[i] for i in range(len(rec.txts)) if valid_score_idx_list[i]],
            "boxScore": box_scores[valid_text_score_idx],
            "textScore": text_scores[valid_text_score_idx],
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
            imgs.append(pil_to_cv2(dst_img))

        return imgs

    def _get_perspective_transform(self, src: NDArray[np.float32], dst: NDArray[np.float32]) -> NDArray[np.float32]:
        N = src.shape[0]
        x, y = src[:, :, 0], src[:, :, 1]
        u, v = dst[:, :, 0], dst[:, :, 1]
        A = np.zeros((N, 8, 9), dtype=np.float32)

        # Fill even rows (0, 2, 4, 6): [x, y, 1, 0, 0, 0, -u*x, -u*y, -u]
        A[:, ::2, 0] = x
        A[:, ::2, 1] = y
        A[:, ::2, 2] = 1
        A[:, ::2, 6] = -u * x
        A[:, ::2, 7] = -u * y
        A[:, ::2, 8] = -u

        # Fill odd rows (1, 3, 5, 7): [0, 0, 0, x, y, 1, -v*x, -v*y, -v]
        A[:, 1::2, 3] = x
        A[:, 1::2, 4] = y
        A[:, 1::2, 5] = 1
        A[:, 1::2, 6] = -v * x
        A[:, 1::2, 7] = -v * y
        A[:, 1::2, 8] = -v

        # Solve using SVD for all matrices at once
        _, _, Vt = np.linalg.svd(A)
        H = Vt[:, -1, :].reshape(N, 3, 3)
        H = H / H[:, 2:3, 2:3]

        # Extract the 8 coefficients for each transformation
        return np.column_stack(
            [H[:, 0, 0], H[:, 0, 1], H[:, 0, 2], H[:, 1, 0], H[:, 1, 1], H[:, 1, 2], H[:, 2, 0], H[:, 2, 1]]
        )  # pyright: ignore[reportReturnType]

    def configure(self, **kwargs: Any) -> None:
        self.min_score = kwargs.get("minScore", self.min_score)
