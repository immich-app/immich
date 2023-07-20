from typing import Any

from clip_server.model.clip import _transform_ndarray
from clip_server.model.clip_onnx import CLIPOnnxModel, _MODELS, _S3_BUCKET_V2, download_model
from clip_server.model.tokenization import Tokenizer
from PIL.Image import Image
import torch
from ..config import settings

from ..schemas import ModelType
from .base import InferenceModel


_ST_TO_CLIP_SERVER_MODEL_NAME = {
    "clip-ViT-B-16": "ViT-B-16::openai",
    "clip-ViT-B-32": "ViT-B-32::openai",
    "clip-ViT-B-32-multilingual-v1": "M-CLIP/XLM-Roberta-Large-Vit-B-32",
    "clip-ViT-L-14": "ViT-L-14::openai"
}


class CLIPEncoder(InferenceModel):
    _model_type = ModelType.CLIP

    def download(self, **model_kwargs: Any) -> None:
        # downloading logic is adapted from clip-server's CLIPOnnxModel class
        if not self.model_name in _MODELS:
            if self.model_name in _ST_TO_CLIP_SERVER_MODEL_NAME:
                print(f"Warning: Sentence-Transformer model names are no longer supported. The best match for '{self.model_name}' is '{_ST_TO_CLIP_SERVER_MODEL_NAME[self.model_name]}'. See https://clip-as-service.jina.ai/user-guides/benchmark/ for more info on the model catalog.")
                self.model_name = _ST_TO_CLIP_SERVER_MODEL_NAME[self.model_name]
            else:
                raise ValueError(f"Unknown model name {self.model_name}.")
        for model_name, model_md5 in _MODELS[self.model_name]:
            if not self.cache_dir / model_name.split("/")[1]:
                download_model(
                    url=_S3_BUCKET_V2 + model_name,
                    target_folder=self.cache_dir.as_posix(),
                    md5sum=model_md5,
                    with_resume=True,
                )

    def load(
        self,
        dtype: str = "fp16" if settings.clip_fp16 else "fp32",
        **model_kwargs: Any,
    ) -> None:
        self.model = CLIPOnnxModel(
            self.model_name,
            dtype=dtype,
            model_path=self.cache_dir.as_posix(),
        )
        self.tokenizer = Tokenizer(self.model_name)
        self.transform = _transform_ndarray(self.model.image_size)

        self.model.start_sessions(dtype=dtype, providers=model_kwargs.pop("providers", self.providers), **model_kwargs)

    def predict(self, image_or_text: Image | str) -> list[float]:
        match image_or_text:
            case Image():
                pixel_values = self.transform(image_or_text)
                assert isinstance(pixel_values, torch.Tensor)
                pixel_values = torch.unsqueeze(pixel_values, 0).numpy()
                outputs = self.model.encode_image({"pixel_values": pixel_values})
            case str():
                text_inputs = self.tokenizer(image_or_text)
                outputs = self.model.encode_text(text_inputs)
            case _:
                raise TypeError(f"Expected Image or str, but got: {type(image_or_text)}")

        return outputs
