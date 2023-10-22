import os
import zipfile
from io import BytesIO
from typing import Any, Literal, TypeGuard

import numpy as np
import onnxruntime as ort
import torch
from clip_server.model.clip import BICUBIC, _convert_image_to_rgb
from clip_server.model.clip_onnx import _MODELS, _S3_BUCKET_V2, CLIPOnnxModel, download_model
from clip_server.model.pretrained_models import _VISUAL_MODEL_IMAGE_SIZE
from clip_server.model.tokenization import Tokenizer
from PIL import Image
from torchvision.transforms import CenterCrop, Compose, Normalize, Resize, ToTensor

from ..config import log
from ..schemas import ModelType
from .base import InferenceModel


def is_image_list(images: list[Any]) -> TypeGuard[list[Image.Image | bytes]]:
    return any(isinstance(image, (Image.Image, bytes)) for image in images)


def is_text_list(texts: list[Any]) -> TypeGuard[list[str]]:
    return any(isinstance(text, str) for text in texts)


class CLIPEncoder(InferenceModel):
    _model_type = ModelType.CLIP

    def __init__(
        self,
        model_name: str,
        cache_dir: str | None = None,
        mode: Literal["text", "vision"] | None = None,
        **model_kwargs: Any,
    ) -> None:
        if mode is not None and mode not in ("text", "vision"):
            raise ValueError(f"Mode must be 'text', 'vision', or omitted; got '{mode}'")
        if model_name not in _MODELS:
            raise ValueError(f"Unknown model name {model_name}.")
        self.mode = mode
        super().__init__(model_name, cache_dir, **model_kwargs)

    def _download(self) -> None:
        models: tuple[tuple[str, str], tuple[str, str]] = _MODELS[self.model_name]
        text_onnx_path = self.cache_dir / "textual.onnx"
        vision_onnx_path = self.cache_dir / "visual.onnx"

        if not text_onnx_path.is_file():
            self._download_model(*models[0])

        if not vision_onnx_path.is_file():
            self._download_model(*models[1])

    def _load(self) -> None:
        if self.mode == "text" or self.mode is None:
            log.debug(f"Loading clip text model '{self.model_name}'")
            self.text_model = ort.InferenceSession(
                self.cache_dir / "textual.onnx",
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            )
            self.text_outputs = [output.name for output in self.text_model.get_outputs()]
            self.tokenizer = Tokenizer(self.model_name)

        if self.mode == "vision" or self.mode is None:
            log.debug(f"Loading clip vision model '{self.model_name}'")
            self.vision_model = ort.InferenceSession(
                self.cache_dir / "visual.onnx",
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            )
            self.vision_outputs = [output.name for output in self.vision_model.get_outputs()]

            image_size = _VISUAL_MODEL_IMAGE_SIZE[CLIPOnnxModel.get_model_name(self.model_name)]
            self.transform = _transform_pil_image(image_size)

    def _predict_batch(self, images_or_text: list[Image.Image | bytes] | list[str]) -> list[list[float]]:
        if not images_or_text:
            return []

        if is_image_list(images_or_text):
            outputs = self._predict_images(images_or_text)
        elif is_text_list(images_or_text):
            outputs = self._predict_text(images_or_text)
        else:
            raise TypeError(f"Expected list of images or text, but got: {type(images_or_text[0])}")

        return outputs

    def _predict_images(self, images: list[Image.Image | bytes]) -> list[list[float]]:
        if not images:
            return []

        for i, element in enumerate(images):
            if isinstance(element, bytes):
                images[i] = Image.open(BytesIO(element))

        pixel_values = torch.stack([self.transform(image) for image in images]).numpy()
        outputs = self.vision_model.run(self.vision_outputs, {"pixel_values": pixel_values})
        return outputs[0].tolist()

    def _predict_text(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        text_inputs: dict[str, torch.Tensor] = self.tokenizer(texts)
        inputs = {
            "input_ids": text_inputs["input_ids"].int().numpy(),
            "attention_mask": text_inputs["attention_mask"].int().numpy(),
        }
        outputs = self.text_model.run(self.text_outputs, inputs)
        return outputs[0].tolist()

    def _download_model(self, model_name: str, model_md5: str) -> bool:
        # downloading logic is adapted from clip-server's CLIPOnnxModel class
        download_model(
            url=_S3_BUCKET_V2 + model_name,
            target_folder=self.cache_dir.as_posix(),
            md5sum=model_md5,
            with_resume=True,
        )
        file = self.cache_dir / model_name.split("/")[1]
        if file.suffix == ".zip":
            with zipfile.ZipFile(file, "r") as zip_ref:
                zip_ref.extractall(self.cache_dir)
            os.remove(file)
        return True

    @property
    def cached(self) -> bool:
        return (self.cache_dir / "textual.onnx").is_file() and (self.cache_dir / "visual.onnx").is_file()


# same as `_transform_blob` without `_blob2image`
def _transform_pil_image(n_px: int) -> Compose:
    return Compose(
        [
            Resize(n_px, interpolation=BICUBIC),
            CenterCrop(n_px),
            _convert_image_to_rgb,
            ToTensor(),
            Normalize(
                (0.48145466, 0.4578275, 0.40821073),
                (0.26862954, 0.26130258, 0.27577711),
            ),
        ]
    )
