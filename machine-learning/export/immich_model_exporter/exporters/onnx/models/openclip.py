import warnings
from dataclasses import dataclass
from functools import cached_property
from pathlib import Path
from typing import Any

from .util import get_model_path, save_config


@dataclass
class OpenCLIPModelConfig:
    name: str
    pretrained: str

    @cached_property
    def model_config(self) -> dict[str, Any]:
        import open_clip

        config: dict[str, Any] | None = open_clip.get_model_config(self.name)
        if config is None:
            raise ValueError(f"Unknown model {self.name}")
        return config

    @property
    def image_size(self) -> int:
        image_size: int = self.model_config["vision_cfg"]["image_size"]
        return image_size

    @property
    def sequence_length(self) -> int:
        context_length: int = self.model_config["text_cfg"].get("context_length", 77)
        return context_length


def to_onnx(
    model_cfg: OpenCLIPModelConfig,
    opset_version: int,
    output_dir_visual: Path | str | None = None,
    output_dir_textual: Path | str | None = None,
    no_cache: bool = False,
) -> tuple[Path | None, Path | None]:
    visual_path = None
    textual_path = None
    if output_dir_visual is not None:
        output_dir_visual = Path(output_dir_visual)
        visual_path = get_model_path(output_dir_visual)

    if output_dir_textual is not None:
        output_dir_textual = Path(output_dir_textual)
        textual_path = get_model_path(output_dir_textual)

    if not no_cache and (
        (textual_path is None or textual_path.exists()) and (visual_path is None or visual_path.exists())
    ):
        print(f"Models {textual_path} and {visual_path} already exist, skipping")
        return visual_path, textual_path

    import open_clip
    import torch
    from transformers import AutoTokenizer

    torch.backends.mha.set_fastpath_enabled(False)

    model = open_clip.create_model(
        model_cfg.name,
        pretrained=model_cfg.pretrained,
        jit=False,
        require_pretrained=True,
    )

    text_vision_cfg = open_clip.get_model_config(model_cfg.name)

    model.eval()
    for param in model.parameters():
        param.requires_grad_(False)

    if visual_path is not None and output_dir_visual is not None:
        if no_cache or not visual_path.exists():
            save_config(
                open_clip.get_model_preprocess_cfg(model),
                output_dir_visual / "preprocess_cfg.json",
            )
            save_config(text_vision_cfg, output_dir_visual.parent / "config.json")
            _export_image_encoder(model, model_cfg, visual_path, opset_version)
        else:
            print(f"Model {visual_path} already exists, skipping")

    if textual_path is not None and output_dir_textual is not None:
        if no_cache or not textual_path.exists():
            tokenizer_name = text_vision_cfg["text_cfg"].get("hf_tokenizer_name", "openai/clip-vit-base-patch32")
            AutoTokenizer.from_pretrained(tokenizer_name).save_pretrained(output_dir_textual)
            _export_text_encoder(model, model_cfg, textual_path, opset_version)
        else:
            print(f"Model {textual_path} already exists, skipping")
    return visual_path, textual_path


def _export_image_encoder(
    model: Any, model_cfg: OpenCLIPModelConfig, output_path: Path | str, opset_version: int
) -> None:
    import torch

    output_path = Path(output_path)

    def encode_image(image: torch.Tensor) -> torch.Tensor:
        output = model.encode_image(image, normalize=True)
        assert isinstance(output, torch.Tensor)
        return output

    model.forward = encode_image

    args = (torch.randn(1, 3, model_cfg.image_size, model_cfg.image_size),)

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        torch.onnx.export(
            model,
            args,
            output_path.as_posix(),
            input_names=["image"],
            output_names=["embedding"],
            opset_version=opset_version,
            # dynamic_axes={"image": {0: "batch_size"}},
        )


def _export_text_encoder(
    model: Any, model_cfg: OpenCLIPModelConfig, output_path: Path | str, opset_version: int
) -> None:
    import torch

    output_path = Path(output_path)

    def encode_text(text: torch.Tensor) -> torch.Tensor:
        output = model.encode_text(text, normalize=True)
        assert isinstance(output, torch.Tensor)
        return output

    model.forward = encode_text

    args = (torch.ones(1, model_cfg.sequence_length, dtype=torch.int32),)

    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        torch.onnx.export(
            model,
            args,
            output_path.as_posix(),
            input_names=["text"],
            output_names=["embedding"],
            opset_version=opset_version,
            # dynamic_axes={"text": {0: "batch_size"}},
        )
