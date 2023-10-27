from dataclasses import dataclass, field
import json
import tempfile
import warnings
from pathlib import Path

import open_clip
import torch

from app.config import log
from app.models.export.optimize import optimize_ort


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
    output_dir_visual: Path | str,
    output_dir_textual: Path | str,
    output_dir_preprocess_cfg: Path | str,
) -> None:
    output_dir_visual = Path(output_dir_visual)
    output_dir_textual = Path(output_dir_textual)
    output_dir_preprocess_cfg = Path(output_dir_preprocess_cfg)

    output_dir_visual.mkdir(parents=True, exist_ok=True)
    output_dir_textual.mkdir(parents=True, exist_ok=True)

    visual_path = output_dir_visual / "model.onnx"
    textual_path = output_dir_textual / "model.onnx"

    with tempfile.TemporaryDirectory() as tmpdir:
        model = open_clip.create_model(
            model_cfg.name,
            pretrained=model_cfg.pretrained,
            jit=False,
            cache_dir=tmpdir,
            require_pretrained=True,
        )

        preprocess_cfg = open_clip.get_model_preprocess_cfg(model)
        json.dump(preprocess_cfg, output_dir_preprocess_cfg.open("w"))

        for param in model.parameters():
            param.requires_grad_(False)

        log.info("Exporting clip model to ONNX")
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            export_image_encoder(model, model_cfg, visual_path)
            export_text_encoder(model, model_cfg, textual_path)

        log.info("Optimizing clip model")
        optimize_ort(visual_path, visual_path)
        optimize_ort(textual_path, textual_path)


def export_image_encoder(model: open_clip.CLIP, model_cfg: OpenCLIPModelConfig, output_path: Path | str) -> None:
    output_path = Path(output_path)

    def encode_image(image: torch.Tensor) -> torch.Tensor:
        return model.encode_image(image, normalize=True)

    args = (torch.randn(1, 3, model_cfg.image_size, model_cfg.image_size),)
    traced = torch.jit.trace(encode_image, args)
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
    torch.onnx.export(
        traced,
        args,
        output_path.as_posix(),
        input_names=["text"],
        output_names=["text_embedding"],
        opset_version=17,
        dynamic_axes={"text": {0: "batch_size"}},
    )
