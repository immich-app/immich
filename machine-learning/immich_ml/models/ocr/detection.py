from typing import Any

import cv2
import numpy as np
from numpy.typing import NDArray
from PIL import Image
from rapidocr.ch_ppocr_det.utils import DBPostProcess
from rapidocr.inference_engine.base import FileInfo, InferSession
from rapidocr.utils.download_file import DownloadFile, DownloadFileInput
from rapidocr.utils.typings import EngineType, LangDet, OCRVersion, TaskType
from rapidocr.utils.typings import ModelType as RapidModelType

from immich_ml.config import log, settings
from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelFormat, ModelSession, ModelTask, ModelType
from immich_ml.sessions.ort import OrtSession

from .schemas import TextDetectionOutput


class TextDetector(InferenceModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.OCR)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        super().__init__(model_name.split("__")[-1], **model_kwargs, model_format=ModelFormat.ONNX)
        self.max_resolution = 736
        self.mean = np.array([0.5, 0.5, 0.5], dtype=np.float32)
        self.std_inv = np.float32(1.0) / (np.array([0.5, 0.5, 0.5], dtype=np.float32) * 255.0)
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
        return OrtSession(self.model_path)

    # partly adapted from RapidOCR
    def _predict(self, inputs: Image.Image) -> TextDetectionOutput:
        w, h = inputs.size
        if w < 32 or h < 32:
            return self._empty
        transformed, letterbox = self._transform(inputs)
        out = self.session.run(None, {"x": transformed})[0]
        if letterbox is None:
            boxes, scores = self.postprocess(out, (h, w))
        else:
            boxes, scores = self.postprocess(out, (letterbox["padded_size"], letterbox["padded_size"]))
            if len(boxes) == 0:
                return self._empty
            boxes = self._undo_letterbox(boxes, letterbox, h, w)
        if len(boxes) == 0:
            return self._empty
        return {
            "boxes": self.sorted_boxes(boxes),
            "scores": np.array(scores, dtype=np.float32),
        }

    # adapted from RapidOCR
    def _transform(self, img: Image.Image) -> tuple[NDArray[np.float32], dict[str, float | int] | None]:
        if (static_size := settings.ocr_detection_static_size) is not None:
            if static_size <= 0:
                log.warning("Ignoring ocr_detection_static_size=%s; must be > 0.", static_size)
                static_size = None
            elif static_size % 32 != 0:
                adjusted = max(32, ((static_size + 16) // 32) * 32)
                log.warning(
                    "Adjusting ocr_detection_static_size=%s to %s to keep it a multiple of 32.",
                    static_size,
                    adjusted,
                )
                static_size = adjusted
        if static_size is not None:
            scale = min(static_size / img.width, static_size / img.height)
            resized_w = max(1, int(round(img.width * scale)))
            resized_h = max(1, int(round(img.height * scale)))
            resized = img.resize((resized_w, resized_h), resample=Image.Resampling.LANCZOS)
            padded = Image.new("RGB", (static_size, static_size))
            offset_x = (static_size - resized_w) // 2
            offset_y = (static_size - resized_h) // 2
            padded.paste(resized, (offset_x, offset_y))
            resized_img = padded
            letterbox = {
                "offset_x": offset_x,
                "offset_y": offset_y,
                "scale_x": resized_w / img.width,
                "scale_y": resized_h / img.height,
                "padded_size": static_size,
            }
        else:
            if img.height < img.width:
                ratio = float(self.max_resolution) / img.height
            else:
                ratio = float(self.max_resolution) / img.width
            ratio = min(ratio, 1.0)

            resize_h = int(img.height * ratio)
            resize_w = int(img.width * ratio)

            resize_h = int(round(resize_h / 32) * 32)
            resize_w = int(round(resize_w / 32) * 32)
            resized_img = img.resize((int(resize_w), int(resize_h)), resample=Image.Resampling.LANCZOS)
            letterbox = None

        img_np: NDArray[np.float32] = cv2.cvtColor(np.array(resized_img, dtype=np.float32), cv2.COLOR_RGB2BGR)  # type: ignore
        img_np -= self.mean
        img_np *= self.std_inv
        img_np = np.transpose(img_np, (2, 0, 1))
        return np.expand_dims(img_np, axis=0), letterbox

    @staticmethod
    def _undo_letterbox(
        boxes: NDArray[np.float32] | NDArray[np.int32],
        letterbox: dict[str, float | int],
        img_height: int,
        img_width: int,
    ) -> NDArray[np.float32]:
        # Map boxes from the padded square back to the original image space.
        offset_x = int(letterbox["offset_x"])
        offset_y = int(letterbox["offset_y"])
        scale_x = float(letterbox["scale_x"])
        scale_y = float(letterbox["scale_y"])
        boxes_f = boxes.astype(np.float32, copy=True)
        boxes_f[:, :, 0] = (boxes_f[:, :, 0] - offset_x) / scale_x
        boxes_f[:, :, 1] = (boxes_f[:, :, 1] - offset_y) / scale_y
        boxes_f[:, :, 0] = np.clip(boxes_f[:, :, 0], 0, img_width - 1)
        boxes_f[:, :, 1] = np.clip(boxes_f[:, :, 1], 0, img_height - 1)
        return boxes_f

    def sorted_boxes(self, dt_boxes: NDArray[np.float32]) -> NDArray[np.float32]:
        if len(dt_boxes) == 0:
            return dt_boxes

        # Sort by y, then identify lines, then sort by (line, x)
        y_order = np.argsort(dt_boxes[:, 0, 1], kind="stable")
        sorted_y = dt_boxes[y_order, 0, 1]

        line_ids = np.empty(len(dt_boxes), dtype=np.int32)
        line_ids[0] = 0
        np.cumsum(np.abs(np.diff(sorted_y)) >= 10, out=line_ids[1:])

        # Create composite sort key for final ordering
        # Shift line_ids by large factor, add x for tie-breaking
        sort_key = line_ids[y_order] * 1e6 + dt_boxes[y_order, 0, 0]
        final_order = np.argsort(sort_key, kind="stable")
        sorted_boxes: NDArray[np.float32] = dt_boxes[y_order[final_order]]
        return sorted_boxes

    def configure(self, **kwargs: Any) -> None:
        if (max_resolution := kwargs.get("maxResolution")) is not None:
            self.max_resolution = max_resolution
        if (min_score := kwargs.get("minScore")) is not None:
            self.postprocess.box_thresh = min_score
        if (score_mode := kwargs.get("scoreMode")) is not None:
            self.postprocess.score_mode = score_mode
