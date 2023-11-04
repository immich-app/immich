import json
from enum import Enum
from pathlib import Path
from typing import Any


class ModelType(Enum):
    ONNX = "onnx"
    TFLITE = "tflite"


def get_model_path(output_dir: Path | str, model_type: ModelType = ModelType.ONNX) -> Path:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir / f"model.{model_type.value}"


def save_config(config: Any, output_path: Path | str) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    json.dump(config, output_path.open("w"))
