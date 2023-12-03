import json
from abc import abstractmethod
from functools import cached_property
from io import BytesIO
from pathlib import Path
from typing import Any, Literal

import numpy as np
import onnxruntime as ort
from PIL import Image
from transformers import AutoTokenizer

from app.config import clean_name, log
from app.models.transforms import crop, get_pil_resampling, normalize, resize, to_numpy
from app.schemas import ModelType, ndarray_f32, ndarray_i32, ndarray_i64

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

    def _predict(self, image_or_text: Image.Image | str) -> ndarray_f32:
        if isinstance(image_or_text, bytes):
            image_or_text = Image.open(BytesIO(image_or_text))

        match image_or_text:
            case Image.Image():
                if self.mode == "text":
                    raise TypeError("Cannot encode image as text-only model")

                outputs: ndarray_f32 = self.vision_model.run(None, self.transform(image_or_text))[0][0]
            case str():
                if self.mode == "vision":
                    raise TypeError("Cannot encode text as vision-only model")

                outputs = self.text_model.run(None, self.tokenize(image_or_text))[0][0]
            case _:
                raise TypeError(f"Expected Image or str, but got: {type(image_or_text)}")

        return outputs

    @abstractmethod
    def tokenize(self, text: str) -> dict[str, ndarray_i32]:
        pass

    @abstractmethod
    def transform(self, image: Image.Image) -> dict[str, ndarray_f32]:
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
        super().__init__(clean_name(model_name), cache_dir, mode, **model_kwargs)

    def _load(self) -> None:
        super()._load()

        self.tokenizer = AutoTokenizer.from_pretrained(self.textual_dir)
        self.sequence_length = self.model_cfg["text_cfg"]["context_length"]

        self.size = (
            self.preprocess_cfg["size"][0] if type(self.preprocess_cfg["size"]) == list else self.preprocess_cfg["size"]
        )
        self.resampling = get_pil_resampling(self.preprocess_cfg["interpolation"])
        self.mean = np.array(self.preprocess_cfg["mean"], dtype=np.float32)
        self.std = np.array(self.preprocess_cfg["std"], dtype=np.float32)

    def tokenize(self, text: str) -> dict[str, ndarray_i32]:
        input_ids: ndarray_i64 = self.tokenizer(
            text,
            max_length=self.sequence_length,
            return_tensors="np",
            return_attention_mask=False,
            padding="max_length",
            truncation=True,
        ).input_ids
        return {"text": input_ids.astype(np.int32)}

    def transform(self, image: Image.Image) -> dict[str, ndarray_f32]:
        image = resize(image, self.size)
        image = crop(image, self.size)
        image_np = to_numpy(image)
        image_np = normalize(image_np, self.mean, self.std)
        return {"image": np.expand_dims(image_np.transpose(2, 0, 1), 0)}

    @cached_property
    def model_cfg(self) -> dict[str, Any]:
        model_cfg: dict[str, Any] = json.load(self.model_cfg_path.open())
        return model_cfg

    @cached_property
    def preprocess_cfg(self) -> dict[str, Any]:
        preprocess_cfg: dict[str, Any] = json.load(self.preprocess_cfg_path.open())
        return preprocess_cfg


class MCLIPEncoder(OpenCLIPEncoder):
    def tokenize(self, text: str) -> dict[str, ndarray_i32]:
        tokens: dict[str, ndarray_i64] = self.tokenizer(text, return_tensors="np")
        return {k: v.astype(np.int32) for k, v in tokens.items()}
