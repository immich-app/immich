import json
from abc import abstractmethod
from functools import cached_property
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray
from tokenizers import Encoding, Tokenizer

from immich_ml.config import log
from immich_ml.models.base import InferenceModel
from immich_ml.models.constants import WEBLATE_TO_FLORES200
from immich_ml.models.transforms import clean_text, serialize_np_array
from immich_ml.schemas import ModelSession, ModelTask, ModelType


def _mapped(model_path: Path, name: str) -> NDArray[Any]:
    import onnx

    initializer = next(i for i in onnx.load(model_path, load_external_data=False).graph.initializer if i.name == name)
    data = {entry.key: entry.value for entry in initializer.external_data}
    dtype = onnx.helper.tensor_dtype_to_np_dtype(initializer.data_type)
    offset, shape = int(data.get("offset", 0)), tuple(initializer.dims)
    return np.memmap(model_path.parent / data["location"], dtype=dtype, mode="r", offset=offset, shape=shape)


class BaseCLIPTextualEncoder(InferenceModel):
    depends = []
    identity = (ModelType.TEXTUAL, ModelTask.SEARCH)
    threads = 4  # lower search latency

    def _predict(self, inputs: str, language: str | None = None) -> str:
        tokens: dict[str, NDArray[Any]] = self.tokenize(inputs, language=language)
        graph = self.session.for_shape(self.shape_policy.dims[0])
        if self.embedding is not None:  # a graph that left its token table to the host
            tokens["token_embeds"] = self.embedding[next(iter(tokens.values()))]
        res: NDArray[np.float32] = graph.run(None, {node.name: tokens[node.name] for node in graph.get_inputs()})[0][0]
        return serialize_np_array(res)

    def _load(self) -> ModelSession:
        session = super()._load()
        table = session.for_shape(self.shape_policy.dims[0]).get_metadata().get("embedding")
        self.embedding = _mapped(self.model_dir / "model.onnx", table) if table is not None else None
        log.debug(f"Loading tokenizer for CLIP model '{self.model_name}'")
        self.tokenizer = self._load_tokenizer()
        tokenizer_kwargs: dict[str, Any] | None = self.text_cfg.get("tokenizer_kwargs")
        self.canonicalize = tokenizer_kwargs is not None and tokenizer_kwargs.get("clean") == "canonicalize"
        self.is_nllb = self.model_name.startswith("nllb")
        log.debug(f"Loaded tokenizer for CLIP model '{self.model_name}'")

        return session

    @abstractmethod
    def _load_tokenizer(self) -> Tokenizer:
        pass

    @abstractmethod
    def tokenize(self, text: str, language: str | None = None) -> dict[str, NDArray[np.int32]]:
        pass

    @property
    def model_cfg_path(self) -> Path:
        return self.cache_dir / "config.json"

    @property
    def tokenizer_file_path(self) -> Path:
        return self.model_dir / "tokenizer.json"

    @property
    def tokenizer_cfg_path(self) -> Path:
        return self.model_dir / "tokenizer_config.json"

    @cached_property
    def model_cfg(self) -> dict[str, Any]:
        log.debug(f"Loading model config for CLIP model '{self.model_name}'")
        model_cfg: dict[str, Any] = json.load(self.model_cfg_path.open(encoding="utf-8"))
        log.debug(f"Loaded model config for CLIP model '{self.model_name}'")
        return model_cfg

    @property
    def text_cfg(self) -> dict[str, Any]:
        text_cfg: dict[str, Any] = self.model_cfg["text_cfg"]
        return text_cfg

    @cached_property
    def tokenizer_file(self) -> dict[str, Any]:
        log.debug(f"Loading tokenizer file for CLIP model '{self.model_name}'")
        tokenizer_file: dict[str, Any] = json.load(self.tokenizer_file_path.open(encoding="utf-8"))
        log.debug(f"Loaded tokenizer file for CLIP model '{self.model_name}'")
        return tokenizer_file

    @cached_property
    def tokenizer_cfg(self) -> dict[str, Any]:
        log.debug(f"Loading tokenizer config for CLIP model '{self.model_name}'")
        tokenizer_cfg: dict[str, Any] = json.load(self.tokenizer_cfg_path.open(encoding="utf-8"))
        log.debug(f"Loaded tokenizer config for CLIP model '{self.model_name}'")
        return tokenizer_cfg


class OpenClipTextualEncoder(BaseCLIPTextualEncoder):
    def _load_tokenizer(self) -> Tokenizer:
        context_length: int = self.text_cfg.get("context_length", 77)
        pad_token: str = self.tokenizer_cfg["pad_token"]

        tokenizer: Tokenizer = Tokenizer.from_file(self.tokenizer_file_path.as_posix())

        pad_id = tokenizer.token_to_id(pad_token)
        if pad_id is None:
            raise ValueError(f"Pad token '{pad_token}' not found in tokenizer vocab")
        tokenizer.enable_padding(length=context_length, pad_token=pad_token, pad_id=pad_id)
        tokenizer.enable_truncation(max_length=context_length)

        return tokenizer

    def tokenize(self, text: str, language: str | None = None) -> dict[str, NDArray[np.int32]]:
        text = clean_text(text, canonicalize=self.canonicalize)
        if self.is_nllb and language is not None:
            flores_code = WEBLATE_TO_FLORES200.get(language)
            if flores_code is None:
                no_country = language.split("-")[0]
                flores_code = WEBLATE_TO_FLORES200.get(no_country)
                if flores_code is None:
                    log.warning(f"Language '{language}' not found, defaulting to 'en'")
                    flores_code = "eng_Latn"
            text = f"{flores_code}{text}"
        tokens: Encoding = self.tokenizer.encode(text)
        return {"text": np.array([tokens.ids], dtype=np.int32)}


class MClipTextualEncoder(OpenClipTextualEncoder):
    def tokenize(self, text: str, language: str | None = None) -> dict[str, NDArray[np.int32]]:
        text = clean_text(text, canonicalize=self.canonicalize)
        tokens: Encoding = self.tokenizer.encode(text)
        return {
            "input_ids": np.array([tokens.ids], dtype=np.int32),
            "attention_mask": np.array([tokens.attention_mask], dtype=np.int32),
        }
