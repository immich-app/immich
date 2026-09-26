from typing import Any

from immich_ml.config import log, settings
from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelFormat, ModelType


# TODO: Remove once everything uses the new model graphs
class TextModel(InferenceModel):
    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        if settings.legacy_models:
            model_kwargs["model_format"] = ModelFormat.ONNX  # the older exports come in no other format
        super().__init__(model_name, **model_kwargs)

    def download(self) -> None:
        if not settings.legacy_models or self.cached:
            return super().download()
        # here, as only an install still on the older exports has a use for it
        from rapidocr.inference_engine.base import FileInfo, InferSession
        from rapidocr.utils.download_file import DownloadFile, DownloadFileInput
        from rapidocr.utils.typings import EngineType, LangDet, LangRec, OCRVersion, TaskType
        from rapidocr.utils.typings import ModelType as RapidModelType

        detects = self.model_type == ModelType.DETECTION
        language = self.model_name.split("__")[0] if "__" in self.model_name else "CH"
        model_info = InferSession.get_model_url(
            FileInfo(
                engine_type=EngineType.ONNXRUNTIME,
                ocr_version=OCRVersion.PPOCRV5,
                task_type=TaskType.DET if detects else TaskType.REC,
                lang_type=LangDet.CH if detects else LangRec[language],
                model_type=RapidModelType.MOBILE if "mobile" in self.model_name else RapidModelType.SERVER,
            )
        )
        log.info(
            f"Downloading {self.model_type} model '{self.model_name}' to {self.model_path}. This may take a while."
        )
        DownloadFile.run(
            DownloadFileInput(
                file_url=model_info["model_dir"], sha256=model_info["SHA256"], save_path=self.model_path, logger=log
            )
        )
