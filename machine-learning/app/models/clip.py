import json
from abc import abstractmethod
from functools import cached_property
from io import BytesIO
from pathlib import Path
from typing import Any, Literal

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from tokenizers import Encoding, Tokenizer

from app.config import clean_name, log
from app.models.transforms import crop, get_pil_resampling, normalize, resize, to_numpy
from app.schemas import ModelType

from .base import InferenceModel


class BaseCLIPEncoder(InferenceModel):
    _model_type = ModelType.CLIP

    def __init__(
        self,
        model_name: str,
        cache_dir: Path | str | None = None,
        mode: Literal["text", "vision"] | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.mode = mode
        super().__init__(model_name, cache_dir, **model_kwargs)

    def _load(self) -> None:
        if self.mode == "text" or self.mode is None:
            log.debug(f"Loading clip text model '{self.model_name}'")
            self.text_model = self._make_session(self.textual_path)
            log.debug(f"Loaded clip text model '{self.model_name}'")

        if self.mode == "vision" or self.mode is None:
            log.debug(f"Loading clip vision model '{self.model_name}'")
            self.vision_model = self._make_session(self.visual_path)
            log.debug(f"Loaded clip vision model '{self.model_name}'")

    def _predict(self, image_or_text: Image.Image | str) -> NDArray[np.float32]:
        if isinstance(image_or_text, bytes):
            image_or_text = Image.open(BytesIO(image_or_text))

        match image_or_text:
            case Image.Image():
                if self.mode == "text":
                    raise TypeError("Cannot encode image as text-only model")
                outputs: NDArray[np.float32] = self.vision_model.run(None, self.transform(image_or_text))[0][0]
            case str():
                if self.mode == "vision":
                    raise TypeError("Cannot encode text as vision-only model")
                outputs = self.text_model.run(None, self.tokenize(image_or_text))[0][0]
            case _:
                raise TypeError(f"Expected Image or str, but got: {type(image_or_text)}")

        return outputs

    @abstractmethod
    def tokenize(self, text: str) -> dict[str, NDArray[np.int32]]:
        pass

    @abstractmethod
    def transform(self, image: Image.Image) -> dict[str, NDArray[np.float32]]:
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
        return self.textual_dir / f"model.{self.preferred_runtime}"

    @property
    def visual_path(self) -> Path:
        return self.visual_dir / f"model.{self.preferred_runtime}"

    @property
    def tokenizer_file_path(self) -> Path:
        return self.textual_dir / "tokenizer.json"

    @property
    def tokenizer_cfg_path(self) -> Path:
        return self.textual_dir / "tokenizer_config.json"

    @property
    def preprocess_cfg_path(self) -> Path:
        return self.visual_dir / "preprocess_cfg.json"

    @property
    def cached(self) -> bool:
        return self.textual_path.is_file() and self.visual_path.is_file()

    @cached_property
    def model_cfg(self) -> dict[str, Any]:
        log.debug(f"Loading model config for CLIP model '{self.model_name}'")
        model_cfg: dict[str, Any] = json.load(self.model_cfg_path.open())
        log.debug(f"Loaded model config for CLIP model '{self.model_name}'")
        return model_cfg

    @cached_property
    def tokenizer_file(self) -> dict[str, Any]:
        log.debug(f"Loading tokenizer file for CLIP model '{self.model_name}'")
        tokenizer_file: dict[str, Any] = json.load(self.tokenizer_file_path.open())
        log.debug(f"Loaded tokenizer file for CLIP model '{self.model_name}'")
        return tokenizer_file

    @cached_property
    def tokenizer_cfg(self) -> dict[str, Any]:
        log.debug(f"Loading tokenizer config for CLIP model '{self.model_name}'")
        tokenizer_cfg: dict[str, Any] = json.load(self.tokenizer_cfg_path.open())
        log.debug(f"Loaded tokenizer config for CLIP model '{self.model_name}'")
        return tokenizer_cfg

    @cached_property
    def preprocess_cfg(self) -> dict[str, Any]:
        log.debug(f"Loading visual preprocessing config for CLIP model '{self.model_name}'")
        preprocess_cfg: dict[str, Any] = json.load(self.preprocess_cfg_path.open())
        log.debug(f"Loaded visual preprocessing config for CLIP model '{self.model_name}'")
        return preprocess_cfg


class OpenCLIPEncoder(BaseCLIPEncoder):
    def __init__(
        self,
        model_name: str,
        cache_dir: Path | str | None = None,
        mode: Literal["text", "vision"] | None = None,
        **model_kwargs: Any,
    ) -> None:
        super().__init__(clean_name(model_name), cache_dir, mode, **model_kwargs)

    def _load(self) -> None:
        super()._load()
        self._load_tokenizer()

        size: list[int] | int = self.preprocess_cfg["size"]
        self.size = size[0] if isinstance(size, list) else size

        self.resampling = get_pil_resampling(self.preprocess_cfg["interpolation"])
        self.mean = np.array(self.preprocess_cfg["mean"], dtype=np.float32)
        self.std = np.array(self.preprocess_cfg["std"], dtype=np.float32)

    def _load_tokenizer(self) -> Tokenizer:
        log.debug(f"Loading tokenizer for CLIP model '{self.model_name}'")

        text_cfg: dict[str, Any] = self.model_cfg["text_cfg"]
        context_length: int = text_cfg.get("context_length", 77)
        pad_token: str = self.tokenizer_cfg["pad_token"]

        self.tokenizer: Tokenizer = Tokenizer.from_file(self.tokenizer_file_path.as_posix())

        pad_id: int = self.tokenizer.token_to_id(pad_token)
        self.tokenizer.enable_padding(length=context_length, pad_token=pad_token, pad_id=pad_id)
        self.tokenizer.enable_truncation(max_length=context_length)

        log.debug(f"Loaded tokenizer for CLIP model '{self.model_name}'")

    def tokenize(self, text: str) -> dict[str, NDArray[np.int32]]:
        tokens: Encoding = self.tokenizer.encode(text)
        return {"text": np.array([tokens.ids], dtype=np.int32)}

    def transform(self, image: Image.Image) -> dict[str, NDArray[np.float32]]:
        image = resize(image, self.size)
        image = crop(image, self.size)
        image_np = to_numpy(image)
        image_np = normalize(image_np, self.mean, self.std)
        return {"image": np.expand_dims(image_np.transpose(2, 0, 1), 0)}


class MCLIPEncoder(OpenCLIPEncoder):
    def tokenize(self, text: str) -> dict[str, NDArray[np.int32]]:
        tokens: Encoding = self.tokenizer.encode(text)
        return {
            "input_ids": np.array([tokens.ids], dtype=np.int32),
            "attention_mask": np.array([tokens.attention_mask], dtype=np.int32),
        }
