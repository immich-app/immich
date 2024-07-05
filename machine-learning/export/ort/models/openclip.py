import tempfile
import warnings
from dataclasses import dataclass, field
from pathlib import Path

import open_clip
import torch
from transformers import AutoTokenizer

from .optimize import optimize
from .util import get_model_path, save_config


@dataclass
class OpenCLIPModelConfig:
    name: str
    pretrained: str
    image_size: int = field(init=False)
    sequence_length: int = field(init=False)

    def __post_init__(self) -> None:
        open_clip_cfg = open_clip.get_model_config(self.name)
        if open_clip_cfg is None:
            raise ValueError(f"Unknown model {self.name}")
        self.image_size = open_clip_cfg["vision_cfg"]["image_size"]
        self.sequence_length = open_clip_cfg["text_cfg"]["context_length"]


def to_torchscript(model_name: str) -> torch.jit.ScriptModule:
    with tempfile.TemporaryDirectory() as tmpdir:
        model = MultilingualCLIP.from_pretrained(model_name, cache_dir=tmpdir)

        model.eval()
        for param in model.parameters():
            param.requires_grad_(False)
        
        return model


def to_onnx(
    model_cfg: OpenCLIPModelConfig,
    output_dir_visual: Path | str | None = None,
    output_dir_textual: Path | str | None = None,
) -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        model = open_clip.create_model(
            model_cfg.name,
            pretrained=model_cfg.pretrained,
            jit=False,
            cache_dir=tmpdir,
            require_pretrained=True,
        )

        text_vision_cfg = open_clip.get_model_config(model_cfg.name)

        for param in model.parameters():
            param.requires_grad_(False)

        if output_dir_visual is not None:
            output_dir_visual = Path(output_dir_visual)
            visual_path = get_model_path(output_dir_visual)

            save_config(open_clip.get_model_preprocess_cfg(model), output_dir_visual / "preprocess_cfg.json")
            save_config(text_vision_cfg, output_dir_visual.parent / "config.json")
            _image_encoder_to_onnx(model, model_cfg, visual_path)

            optimize(visual_path)

        if output_dir_textual is not None:
            output_dir_textual = Path(output_dir_textual)
            textual_path = get_model_path(output_dir_textual)

            tokenizer_name = text_vision_cfg["text_cfg"].get("hf_tokenizer_name", "openai/clip-vit-base-patch32")
            AutoTokenizer.from_pretrained(tokenizer_name).save_pretrained(output_dir_textual)
            _text_encoder_to_onnx(model, model_cfg, textual_path)
            optimize(textual_path)


def _image_encoder_to_onnx(model: open_clip.CLIP, model_cfg: OpenCLIPModelConfig, output_path: Path | str) -> None:
    output_path = Path(output_path)

    def encode_image(image: torch.Tensor) -> torch.Tensor:
        output = model.encode_image(image, normalize=True)
        assert isinstance(output, torch.Tensor)
        return output

    args = (torch.randn(1, 3, model_cfg.image_size, model_cfg.image_size),)
    traced = torch.jit.trace(encode_image, args)  # type: ignore[no-untyped-call]

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        torch.onnx.export(
            traced,
            args,
            output_path.as_posix(),
            input_names=["image"],
            output_names=["image_embedding"],
            opset_version=17,
            dynamic_axes={"image": {0: "batch_size"}},
        )


def _text_encoder_to_onnx(model: open_clip.CLIP, model_cfg: OpenCLIPModelConfig, output_path: Path | str) -> None:
    output_path = Path(output_path)

    def encode_text(text: torch.Tensor) -> torch.Tensor:
        output = model.encode_text(text, normalize=True)
        assert isinstance(output, torch.Tensor)
        return output

    args = (torch.ones(1, model_cfg.sequence_length, dtype=torch.int32),)
    traced = torch.jit.trace(encode_text, args)  # type: ignore[no-untyped-call]

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        torch.onnx.export(
            traced,
            args,
            output_path.as_posix(),
            input_names=["text"],
            output_names=["text_embedding"],
            opset_version=17,
            dynamic_axes={"text": {0: "batch_size"}},
        )
