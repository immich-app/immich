import json
from abc import abstractmethod
from functools import cached_property
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
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
from immich_ml.schemas import ModelSession, ModelTask, ModelType
from immich_ml.sessions.ort import OrtSession


class BaseCLIPVisualEncoder(InferenceModel):
    depends = []
    identity = (ModelType.VISUAL, ModelTask.SEARCH)

    _ACCEL_PROVIDERS = {
        "CUDAExecutionProvider",
        "ROCMExecutionProvider",
        "OpenVINOExecutionProvider",
    }

    def _predict(self, inputs: Image.Image | bytes) -> str:
        image = decode_pil(inputs)
        res: NDArray[np.float32] = self.session.run(None, self.transform(image))[0][0]
        return serialize_np_array(res)

    @abstractmethod
    def transform(self, image: Image.Image) -> dict[str, NDArray[np.float32]]:
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
        model_cfg: dict[str, Any] = json.load(self.model_cfg_path.open())
        log.debug(f"Loaded model config for CLIP model '{self.model_name}'")
        return model_cfg

    @cached_property
    def preprocess_cfg(self) -> dict[str, Any]:
        log.debug(f"Loading visual preprocessing config for CLIP model '{self.model_name}'")
        preprocess_cfg: dict[str, Any] = json.load(self.preprocess_cfg_path.open())
        log.debug(f"Loaded visual preprocessing config for CLIP model '{self.model_name}'")
        return preprocess_cfg

    def _make_session(self, model_path: Path) -> ModelSession:
        providers, available = self._preferred_providers()
        if providers is not None:
            log.warning(
                "Disabling CoreML for CLIP visual model '%s'; only CoreML available (providers=%s). Falling back to %s",
                self.model_name,
                sorted(available),
                providers,
            )
            return OrtSession(model_path, providers=providers)
        return super()._make_session(model_path)

    def _preferred_providers(self) -> tuple[list[str] | None, set[str]]:
        available_providers = set(ort.get_available_providers())
        if "CoreMLExecutionProvider" not in available_providers:
            return None, available_providers
        if available_providers & self._ACCEL_PROVIDERS:
            return None, available_providers
        return ["CPUExecutionProvider"], available_providers


class OpenClipVisualEncoder(BaseCLIPVisualEncoder):
    def _load(self) -> ModelSession:
        size: list[int] | int = self.preprocess_cfg["size"]
        self.size = size[0] if isinstance(size, list) else size

        self.resampling = get_pil_resampling(self.preprocess_cfg["interpolation"])
        self.mean = np.array(self.preprocess_cfg["mean"], dtype=np.float32)
        self.std = np.array(self.preprocess_cfg["std"], dtype=np.float32)

        return super()._load()

    def transform(self, image: Image.Image) -> dict[str, NDArray[np.float32]]:
        image = resize_pil(image, self.size)
        image = crop_pil(image, self.size)
        image_np = to_numpy(image)
        image_np = normalize(image_np, self.mean, self.std)
        return {"image": np.expand_dims(image_np.transpose(2, 0, 1), 0)}
