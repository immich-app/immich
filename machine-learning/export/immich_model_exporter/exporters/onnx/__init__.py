from pathlib import Path

from ..constants import ModelSource
from .models import mclip, openclip


def export(
    model_name: str, model_source: ModelSource, output_dir: Path, opset_version: int = 19, cache: bool = True
) -> None:
    visual_dir = output_dir / "visual"
    textual_dir = output_dir / "textual"
    match model_source:
        case ModelSource.MCLIP:
            mclip.to_onnx(model_name, opset_version, visual_dir, textual_dir, cache=cache)
        case ModelSource.OPENCLIP:
            name, _, pretrained = model_name.partition("__")
            config = openclip.OpenCLIPModelConfig(name, pretrained)
            openclip.to_onnx(config, opset_version, visual_dir, textual_dir, cache=cache)
        case _:
            raise ValueError(f"Unsupported model source {model_source}")
