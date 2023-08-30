import os
import zipfile
from io import BytesIO
from typing import Any, Literal

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

_ST_TO_JINA_MODEL_NAME = {
    "clip-ViT-B-16": "ViT-B-16::openai",
    "clip-ViT-B-32": "ViT-B-32::openai",
    "clip-ViT-B-32-multilingual-v1": "M-CLIP/XLM-Roberta-Large-Vit-B-32",
    "clip-ViT-L-14": "ViT-L-14::openai",
}


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
        if "vit-b" not in model_name.lower():
            raise ValueError(f"Only ViT-B models are currently supported; got '{model_name}'")
        self.mode = mode
        jina_model_name = self._get_jina_model_name(model_name)
        super().__init__(jina_model_name, cache_dir, **model_kwargs)

    def _download(self, **model_kwargs: Any) -> None:
        models: tuple[tuple[str, str], tuple[str, str]] = _MODELS[self.model_name]
        text_onnx_path = self.cache_dir / "textual.onnx"
        vision_onnx_path = self.cache_dir / "visual.onnx"

        if not text_onnx_path.is_file():
            self._download_model(*models[0])

        if not vision_onnx_path.is_file():
            self._download_model(*models[1])

    def _load(self, **model_kwargs: Any) -> None:
        if self.mode == "text" or self.mode is None:
            self.text_model = ort.InferenceSession(
                self.cache_dir / "textual.onnx",
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            )
            self.text_outputs = [output.name for output in self.text_model.get_outputs()]
            self.tokenizer = Tokenizer(self.model_name)

        if self.mode == "vision" or self.mode is None:
            self.vision_model = ort.InferenceSession(
                self.cache_dir / "visual.onnx",
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            )
            self.vision_outputs = [output.name for output in self.vision_model.get_outputs()]

            image_size = _VISUAL_MODEL_IMAGE_SIZE[CLIPOnnxModel.get_model_name(self.model_name)]
            self.transform = _transform_pil_image(image_size)

    def _predict(self, image_or_text: Image.Image | str) -> list[float]:
        if isinstance(image_or_text, bytes):
            image_or_text = Image.open(BytesIO(image_or_text))

        match image_or_text:
            case Image.Image():
                if self.mode == "text":
                    raise TypeError("Cannot encode image as text-only model")
                pixel_values = self.transform(image_or_text)
                assert isinstance(pixel_values, torch.Tensor)
                pixel_values = torch.unsqueeze(pixel_values, 0).numpy()
                outputs = self.vision_model.run(self.vision_outputs, {"pixel_values": pixel_values})
            case str():
                if self.mode == "vision":
                    raise TypeError("Cannot encode text as vision-only model")
                text_inputs: dict[str, torch.Tensor] = self.tokenizer(image_or_text)
                inputs = {
                    "input_ids": text_inputs["input_ids"].int().numpy(),
                    "attention_mask": text_inputs["attention_mask"].int().numpy(),
                }
                outputs = self.text_model.run(self.text_outputs, inputs)
            case _:
                raise TypeError(f"Expected Image or str, but got: {type(image_or_text)}")

        return outputs[0][0].tolist()

    def _get_jina_model_name(self, model_name: str) -> str:
        if model_name in _MODELS:
            return model_name
        elif model_name in _ST_TO_JINA_MODEL_NAME:
            log.warn(
                (
                    f"Sentence-Transformer models like '{model_name}' are not supported."
                    f"Using '{_ST_TO_JINA_MODEL_NAME[model_name]}' instead as it is the best match for '{model_name}'."
                ),
            )
            return _ST_TO_JINA_MODEL_NAME[model_name]
        else:
            raise ValueError(f"Unknown model name {model_name}.")

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
