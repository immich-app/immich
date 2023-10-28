import json
import tempfile
import warnings
from dataclasses import dataclass, field
from pathlib import Path

import open_clip
import torch

from export.util import get_model_path

from .optimize import optimize


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

        for param in model.parameters():
            param.requires_grad_(False)

        if output_dir_visual is not None:
            visual_path = get_model_path(output_dir_visual)

            _save_preprocess_cfg(output_dir_visual)
            _save_model_cfg(model_cfg, output_dir_visual.parent)
            export_image_encoder(model, model_cfg, visual_path)

            optimize(visual_path)

        if output_dir_textual is not None:
            textual_path = get_model_path(output_dir_textual)

            export_text_encoder(model, model_cfg, textual_path)
            optimize(textual_path)


def export_image_encoder(model: open_clip.CLIP, model_cfg: OpenCLIPModelConfig, output_path: Path | str) -> None:
    output_path = Path(output_path)

    def encode_image(image: torch.Tensor) -> torch.Tensor:
        return model.encode_image(image, normalize=True)

    args = (torch.randn(1, 3, model_cfg.image_size, model_cfg.image_size),)
    traced = torch.jit.trace(encode_image, args)

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


def export_text_encoder(model: open_clip.CLIP, model_cfg: OpenCLIPModelConfig, output_path: Path | str) -> None:
    output_path = Path(output_path)

    def encode_text(text: torch.Tensor) -> torch.Tensor:
        return model.encode_text(text, normalize=True)

    args = (torch.ones(1, model_cfg.sequence_length, dtype=torch.int32),)
    traced = torch.jit.trace(encode_text, args)

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

def _save_preprocess_cfg(model: open_clip.CLIP, output_dir: Path | str) -> None:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    preprocess_cfg_path = output_dir / "preprocess_cfg.json"
    preprocess_cfg = open_clip.get_model_preprocess_cfg(model)
    json.dump(preprocess_cfg, preprocess_cfg_path.open("w"))


def _save_model_cfg(model_cfg: OpenCLIPModelConfig, output_dir: Path | str) -> None:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    model_cfg = open_clip.get_model_config(model_cfg.name)
    model_cfg_path = output_dir / "config.json"
    json.dump(model_cfg, model_cfg_path.open("w"))
