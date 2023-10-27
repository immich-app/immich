import json
from abc import abstractmethod
from io import BytesIO
from pathlib import Path
from typing import Any, Literal
import numpy as np

import onnxruntime as ort
import open_clip
from open_clip.factory import PreprocessCfg
from PIL import Image
from transformers import AutoTokenizer

import app.models.export.mclip as export_mclip
import app.models.export.openclip as export_openclip
from app.config import get_cache_dir, log
from app.schemas import ModelType

from .base import InferenceModel
from .export.openclip import OpenCLIPModelConfig
from app.schemas import ndarray


_MCLIP_TO_OPENCLIP = {
    "M-CLIP/XLM-Roberta-Large-Vit-B-32": OpenCLIPModelConfig("ViT-B-32", "openai"),
    "M-CLIP/XLM-Roberta-Large-Vit-B-16Plus": OpenCLIPModelConfig("ViT-B-16-plus-240", "laion400m_e32"),
    "M-CLIP/LABSE-Vit-L-14": OpenCLIPModelConfig("ViT-L-14", "openai"),
    "M-CLIP/XLM-Roberta-Large-Vit-L-14": OpenCLIPModelConfig("ViT-L-14", "openai"),
}


class BaseCLIPEncoder(InferenceModel):
    _model_type = ModelType.CLIP

    def __init__(
        self,
        model_name: str,
        cache_dir: str | None = None,
        mode: Literal["text", "vision"] | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.mode = mode
        super().__init__(model_name, cache_dir, **model_kwargs)

    def _load(self) -> None:
        if self.mode == "text" or self.mode is None:
            log.debug(f"Loading clip text model '{self.model_name}'")

            self.text_model = ort.InferenceSession(
                self.textual_path.as_posix(),
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            )
            self._load_tokenizer()

        if self.mode == "vision" or self.mode is None:
            log.debug(f"Loading clip vision model '{self.model_name}'")

            self.vision_model = ort.InferenceSession(
                self.visual_path.as_posix(),
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            )
            self._load_transform()

    def _predict(self, image_or_text: Image.Image | str) -> list[float]:
        if isinstance(image_or_text, bytes):
            image_or_text = Image.open(BytesIO(image_or_text))

        match image_or_text:
            case Image.Image():
                if self.mode == "text":
                    raise TypeError("Cannot encode image as text-only model")

                outputs = self.encode_image(image_or_text)
            case str():
                if self.mode == "vision":
                    raise TypeError("Cannot encode text as vision-only model")

                outputs = self.encode_text(image_or_text)
            case _:
                raise TypeError(f"Expected Image or str, but got: {type(image_or_text)}")

        return outputs[0][0].tolist()

    @abstractmethod
    def encode_image(self, image: Image.Image) -> ndarray:
        pass

    @abstractmethod
    def encode_text(self, text: str) -> ndarray:
        pass

    @abstractmethod
    def _load_tokenizer(self) -> None:
        pass

    @abstractmethod
    def _load_transform(self) -> None:
        pass

    @property
    def textual_dir(self) -> Path:
        return self.cache_dir / "textual"

    @property
    def textual_path(self) -> Path:
        return self.textual_dir / "model.onnx"

    @property
    def visual_dir(self) -> Path:
        return self.cache_dir / "visual"

    @property
    def visual_path(self) -> Path:
        return self.visual_dir / "model.onnx"

    @property
    def preprocess_cfg_path(self) -> Path:
        return self.visual_dir / "preprocess_cfg.json"

    @property
    def cached(self) -> bool:
        return self.textual_path.is_file() and self.visual_path.is_file()


class OpenCLIPEncoder(BaseCLIPEncoder):
    def __init__(
        self,
        model_name: str,
        cache_dir: str | None = None,
        mode: Literal["text", "vision"] | None = None,
        model_cfg: OpenCLIPModelConfig | None = None,
        **model_kwargs: Any,
    ) -> None:
        if model_cfg is not None:
            self.model_cfg = model_cfg
        else:
            name, _, pretrained = model_name.replace("hf_hub:", "").partition("::")
            self.model_cfg = OpenCLIPModelConfig(name, pretrained)
        super().__init__(self.model_cfg.name, cache_dir, mode, **model_kwargs)

    def _download(self) -> None:
        export_openclip.to_onnx(self.model_cfg, self.visual_dir, self.textual_dir, self.preprocess_cfg_path)

    def encode_image(self, image: Image.Image) -> ndarray:
        inputs = {"image": self.transform(image).unsqueeze(0).numpy()}
        return self.vision_model.run(None, inputs)

    def encode_text(self, text: str) -> ndarray:
        inputs = {"text": self.tokenizer(text).int().numpy()}
        return self.text_model.run(None, inputs)

    def _load_tokenizer(self) -> None:
        self.tokenizer = open_clip.get_tokenizer(self.model_name)

    def _load_transform(self) -> None:
        preprocess_cfg = PreprocessCfg(**json.load(self.preprocess_cfg_path.open("r")))
        self.transform = open_clip.image_transform(
            image_size=preprocess_cfg.size,
            is_train=False,
            mean=preprocess_cfg.mean,
            std=preprocess_cfg.std,
            resize_mode=preprocess_cfg.resize_mode,
            interpolation=preprocess_cfg.interpolation,
            fill_color=preprocess_cfg.fill_color,
        )


class MCLIPEncoder(OpenCLIPEncoder):
    def __init__(
        self,
        model_name: str,
        cache_dir: str | None = None,
        mode: Literal["text", "vision"] | None = None,
        **model_kwargs: Any,
    ) -> None:
        if model_name not in _MCLIP_TO_OPENCLIP:
            raise ValueError(f"Unsupported M-CLIP model: {model_name}; options are {list(_MCLIP_TO_OPENCLIP)}")
        super().__init__(model_name, cache_dir, mode, _MCLIP_TO_OPENCLIP[model_name], **model_kwargs)
        self.model_name = model_name

    def _download(self) -> None:
        export_mclip.to_onnx(self.model_name, self.textual_dir)
        # M-CLIP is text-only, so we also export the corresponding OpenCLIP visual model
        export_openclip.to_onnx(self.model_cfg, self.visual_dir, self._get_openclip_cache_dir() / "textual", self.preprocess_cfg_path)

    def encode_text(self, text: str) -> ndarray:
        tokens = self.tokenizer(text, return_tensors="np")
        inputs = {
            "input_ids": tokens["input_ids"].astype(np.int32),
            "attention_mask": tokens["attention_mask"].astype(np.int32),
        }
        return self.text_model.run(None, inputs)

    @property
    def visual_dir(self) -> Path:
        return self._get_openclip_cache_dir() / "visual"

    def _load_tokenizer(self) -> None:
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)

    def _get_openclip_cache_dir(self):
        return get_cache_dir(f"{self.model_cfg.name}::{self.model_cfg.pretrained}", ModelType.CLIP)
