import json
from abc import abstractmethod
from functools import cached_property
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from immich_ml.config import log
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import (
    crop_pil,
    decode_pil,
    get_pil_resampling,
    normalize,
    resize_pil,
    serialize_np_array,
    to_numpy,
)
from immich_ml.schemas import ModelGraph, ModelInput, ModelSession, ModelTask, ModelType


class BaseCLIPVisualEncoder(InferenceModel):
    depends = []
    identity = (ModelType.VISUAL, ModelTask.SEARCH)

    def _predict(self, inputs: Image.Image | bytes) -> str:
        image = decode_pil(inputs)
        session = self.session.for_shape(self.shape_policy.dims[0])
        res: NDArray[np.float32] = session.run(None, self.transform(session, image))[0][0]
        return serialize_np_array(res)

    @abstractmethod
    def transform(self, session: ModelGraph, image: Image.Image) -> ModelInput:
        pass

    @property
    def model_cfg_path(self) -> Path:
        return self.cache_dir / "config.json"

    @property
    def preprocess_cfg_path(self) -> Path:
        return self.model_dir / "preprocess_cfg.json"

    @cached_property
    def model_cfg(self) -> dict[str, Any]:
        log.debug(f"Loading model config for CLIP model '{self.model_name}'")
        model_cfg: dict[str, Any] = json.load(self.model_cfg_path.open(encoding="utf-8"))
        log.debug(f"Loaded model config for CLIP model '{self.model_name}'")
        return model_cfg

    @cached_property
    def preprocess_cfg(self) -> dict[str, Any]:
        log.debug(f"Loading visual preprocessing config for CLIP model '{self.model_name}'")
        preprocess_cfg: dict[str, Any] = json.load(self.preprocess_cfg_path.open(encoding="utf-8"))
        log.debug(f"Loaded visual preprocessing config for CLIP model '{self.model_name}'")
        return preprocess_cfg


class OpenClipVisualEncoder(BaseCLIPVisualEncoder):
    def _load(self) -> ModelSession:
        size: list[int] | int = self.preprocess_cfg["size"]
        self.size = size[0] if isinstance(size, list) else size

        self.resampling = get_pil_resampling(self.preprocess_cfg["interpolation"])
        self.mean = np.array(self.preprocess_cfg["mean"], dtype=np.float32)
        self.std = np.array(self.preprocess_cfg["std"], dtype=np.float32)

        return super()._load()

    def transform(self, session: ModelGraph, image: Image.Image) -> ModelInput:
        image = resize_pil(image, self.size, self.resampling)
        image = crop_pil(image, self.size)
        if session.normalizes_input:
            rgb: NDArray[np.uint8] = np.asarray(image if image.mode == "RGB" else image.convert("RGB"))
            return {"image": rgb[None]}
        return {"image": normalize(to_numpy(image), self.mean, self.std).transpose(2, 0, 1)[None]}
