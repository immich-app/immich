from __future__ import annotations

import json
from functools import cached_property
from pathlib import Path
from typing import Any

import numpy as np
from huggingface_hub import snapshot_download
from numpy.typing import NDArray
from PIL import Image

from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelSession, ModelTask, ModelType
from immich_ml.sessions.ort import OrtSession


class NsfwDetectionModel(InferenceModel):
    depends = []
    identity = (ModelType.CLASSIFICATION, ModelTask.NSFW_DETECTION)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        self.hf_model_name = model_name
        self.threshold = float(model_kwargs.get("threshold", 0.85))
        self.device = str(model_kwargs.get("device", "AUTO") or "AUTO")
        super().__init__(model_name, **model_kwargs)

    def configure(self, **kwargs: Any) -> None:
        if "threshold" in kwargs:
            self.threshold = float(kwargs["threshold"])
        if "device" in kwargs:
            device = str(kwargs["device"] or "AUTO")
            if device != self.device:
                self.device = device

    def _download(self) -> None:
        snapshot_download(self.hf_model_name, cache_dir=self.cache_dir, local_dir=self.cache_dir)

    def _load(self) -> ModelSession:
        session = OrtSession(self.model_path, device_id=self.device)
        input_shape = session.get_inputs()[0].shape
        self.size = self._shape_size(input_shape)
        return session

    def _predict(self, image: Image.Image, **model_kwargs: Any) -> dict[str, Any]:
        logits = self.session.run(None, self.transform(image))[0]
        scores = self._softmax(np.squeeze(logits).astype(np.float32))
        labels = self._labels(scores)
        nsfw_score = self._nsfw_score(labels)

        return {
            "isNsfw": nsfw_score >= self.threshold,
            "score": nsfw_score,
            "labels": labels,
        }

    def transform(self, image: Image.Image) -> dict[str, NDArray[np.float32]]:
        image = image.convert("RGB").resize((self.size, self.size))
        image_np = np.asarray(image).astype(np.float32) * self.rescale_factor
        image_np = (image_np - self.image_mean) / self.image_std
        input_name = self.session.get_inputs()[0].name or "pixel_values"
        return {input_name: np.expand_dims(image_np.transpose(2, 0, 1), 0)}

    def _shape_size(self, shape: tuple[int, ...]) -> int:
        for dimension in reversed(shape):
            if isinstance(dimension, int) and dimension > 1:
                return dimension
        return int(self.preprocessor_config.get("size", {}).get("height", 224))

    def _softmax(self, logits: NDArray[np.float32]) -> NDArray[np.float32]:
        if np.isclose(float(logits.sum()), 1.0, atol=0.01) and np.all(logits >= 0):
            return logits

        exp = np.exp(logits - np.max(logits))
        return exp / exp.sum()

    def _labels(self, scores: NDArray[np.float32]) -> dict[str, float]:
        labels: dict[str, float] = {}
        for index, score in enumerate(scores.tolist()):
            label = str(self.id_to_label.get(str(index), self.id_to_label.get(index, index))).lower()
            labels[label] = float(score)
        return labels

    def _nsfw_score(self, labels: dict[str, float]) -> float:
        score = 0.0
        for label, value in labels.items():
            normalized = label.lower()
            if normalized in {"nsfw", "porn", "sexy", "hentai", "explicit"} or "nsfw" in normalized:
                score = max(score, value)
        return score

    @cached_property
    def preprocessor_config(self) -> dict[str, Any]:
        path = self.cache_dir / "preprocessor_config.json"
        if not path.exists():
            return {}
        return json.load(path.open())

    @cached_property
    def id_to_label(self) -> dict[str | int, str | int]:
        path = self.cache_dir / "config.json"
        if not path.exists():
            return {0: "normal", 1: "nsfw"}

        config = json.load(path.open())
        id_to_label = config.get("id2label")
        return id_to_label if isinstance(id_to_label, dict) else {0: "normal", 1: "nsfw"}

    @cached_property
    def image_mean(self) -> NDArray[np.float32]:
        return np.asarray(self.preprocessor_config.get("image_mean", [0.5, 0.5, 0.5]), dtype=np.float32)

    @cached_property
    def image_std(self) -> NDArray[np.float32]:
        return np.asarray(self.preprocessor_config.get("image_std", [0.5, 0.5, 0.5]), dtype=np.float32)

    @cached_property
    def rescale_factor(self) -> float:
        return float(self.preprocessor_config.get("rescale_factor", 1 / 255))

    @property
    def model_path(self) -> Path:
        candidates = [
            self.cache_dir / "onnx" / "model.onnx",
            self.cache_dir / "model.onnx",
            self.model_dir / "model.onnx",
        ]
        for candidate in candidates:
            if candidate.is_file():
                return candidate
        return candidates[0]
