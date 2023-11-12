import json
from pathlib import Path
from typing import Any


_clean_name = str.maketrans(":\\/", "___", ".")


def get_model_path(output_dir: Path | str) -> Path:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir / "model.onnx"


def save_config(config: Any, output_path: Path | str) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    json.dump(config, output_path.open("w"))


def clean_name(model_name: str) -> str:
    return model_name.split("/")[-1].translate(_clean_name)
