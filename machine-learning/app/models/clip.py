import json
from abc import abstractmethod
from io import BytesIO
from pathlib import Path
from typing import Any, Literal

import numpy as np
import onnxruntime as ort
from huggingface_hub import snapshot_download
from PIL import Image
from transformers import AutoTokenizer

from app.config import log
from app.models.transforms import crop, get_pil_resampling, normalize, resize, to_numpy
from app.schemas import ModelType, ndarray

from .base import InferenceModel


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

        if self.mode == "vision" or self.mode is None:
            log.debug(f"Loading clip vision model '{self.model_name}'")

            self.vision_model = ort.InferenceSession(
                self.visual_path.as_posix(),
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            )

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
    def tokenize(self, text: str) -> dict[str, np.ndarray[Any, np.dtype[np.int32]]]:
        pass

    @abstractmethod
    def transform(self, image: Image.Image) -> dict[str, ndarray]:
        pass

    @property
    def textual_dir(self) -> Path:
        return self.cache_dir / "textual"

    @property
    def visual_dir(self) -> Path:
        return self.cache_dir / "visual"

    @property
    def model_cfg_path(self) -> Path:
        return self.cache_dir / "config.json"

    @property
    def textual_path(self) -> Path:
        return self.textual_dir / "model.onnx"

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
        **model_kwargs: Any,
    ) -> None:
        super().__init__(_clean_model_name(model_name), cache_dir, mode, **model_kwargs)

    def _download(self) -> None:
        snapshot_download(
            f"immich-app/{self.model_name}",
            cache_dir=self.cache_dir,
            local_dir=self.cache_dir,
            local_dir_use_symlinks=False,
        )

    def _load(self) -> None:
        super()._load()
        self.tokenizer = AutoTokenizer.from_pretrained(self.textual_dir)

        model_cfg = json.load(self.model_cfg_path.open())
        preprocess_cfg = json.load(self.preprocess_cfg_path.open())

        self.sequence_length = model_cfg["text_cfg"]["context_length"]
        self.size = preprocess_cfg["size"][0] if type(preprocess_cfg["size"]) == list else preprocess_cfg["size"]
        self.resampling = get_pil_resampling(preprocess_cfg["interpolation"])
        self.mean = preprocess_cfg["mean"]
        self.std = preprocess_cfg["std"]

    def encode_image(self, image: Image.Image) -> ndarray:
        return self.vision_model.run(None, self.transform(image))

    def encode_text(self, text: str) -> ndarray:
        return self.text_model.run(None, self.tokenize(text))

    def tokenize(self, text: str) -> dict[str, np.ndarray[Any, np.dtype[np.int32]]]:
        input_ids: np.ndarray[Any, np.dtype[np.int64]] = self.tokenizer(
            text,
            max_length=self.sequence_length,
            return_tensors="np",
            return_attention_mask=False,
            padding="max_length",
            truncation=True,
        ).input_ids
        return {"text": input_ids.astype(np.int32)}

    def transform(self, image: Image.Image) -> dict[str, ndarray]:
        image = resize(image, self.size)
        image = crop(image, self.size)
        image_np = to_numpy(image)
        image_np = normalize(image_np, self.mean, self.std)
        return {"image": np.expand_dims(image_np, 0)}


class MCLIPEncoder(OpenCLIPEncoder):
    def tokenize(self, text: str) -> dict[str, np.ndarray[Any, np.dtype[np.int32]]]:
        tokens: dict[str, np.ndarray[int, np.dtype[np.int64]]] = self.tokenizer(text, return_tensors="np")
        return {k: v.astype(np.int32) for k, v in tokens.items()}


_OPENCLIP_MODELS = {
    "RN50__openai",
    "RN50__yfcc15m",
    "RN50__cc12m",
    "RN101__openai",
    "RN101__yfcc15m",
    "RN50x4__openai",
    "RN50x16__openai",
    "RN50x64__openai",
    "ViT-B-32__openai",
    "ViT-B-32__laion2b_e16",
    "ViT-B-32__laion400m_e31",
    "ViT-B-32__laion400m_e32",
    "ViT-B-32__laion2b-s34b-b79k",
    "ViT-B-16__openai",
    "ViT-B-16__laion400m_e31",
    "ViT-B-16__laion400m_e32",
    "ViT-B-16-plus-240__laion400m_e31",
    "ViT-B-16-plus-240__laion400m_e32",
    "ViT-L-14__openai",
    "ViT-L-14__laion400m_e31",
    "ViT-L-14__laion400m_e32",
    "ViT-L-14__laion2b-s32b-b82k",
    "ViT-L-14-336__openai",
    "ViT-H-14__laion2b-s32b-b79k",
    "ViT-g-14__laion2b-s12b-b42k",
}


_MCLIP_MODELS = {
    "LABSE-Vit-L-14",
    "XLM-Roberta-Large-Vit-B-32",
    "XLM-Roberta-Large-Vit-B-16Plus",
    "XLM-Roberta-Large-Vit-L-14",
}


def _clean_model_name(model_name: str) -> str:
    return model_name.split("/")[-1].replace("::", "__")


def is_openclip(model_name: str) -> bool:
    return _clean_model_name(model_name) in _OPENCLIP_MODELS


def is_mclip(model_name: str) -> bool:
    return _clean_model_name(model_name) in _MCLIP_MODELS
