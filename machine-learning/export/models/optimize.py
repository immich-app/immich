from pathlib import Path

import onnx
import onnxruntime as ort
import onnxsim


def save_onnx(model: onnx.ModelProto, output_path: Path | str) -> None:
    try:
        onnx.save(model, output_path)
    except ValueError as e:
        if "The proto size is larger than the 2 GB limit." in str(e):
            onnx.save(model, output_path, save_as_external_data=True, size_threshold=1_000_000)
        else:
            raise e


def optimize_onnxsim(model_path: Path | str, output_path: Path | str) -> None:
    model_path = Path(model_path)
    output_path = Path(output_path)
    model = onnx.load(model_path.as_posix())
    model, check = onnxsim.simplify(model)
    assert check, "Simplified ONNX model could not be validated"
    for file in model_path.parent.iterdir():
        if file.name.startswith("Constant") or "onnx" in file.name or file.suffix == ".weight":
            file.unlink()
    save_onnx(model, output_path)


def optimize_ort(
    model_path: Path | str,
    output_path: Path | str,
    level: ort.GraphOptimizationLevel = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC,
) -> None:
    model_path = Path(model_path)
    output_path = Path(output_path)

    sess_options = ort.SessionOptions()
    sess_options.graph_optimization_level = level
    sess_options.optimized_model_filepath = output_path.as_posix()

    ort.InferenceSession(model_path.as_posix(), providers=["CPUExecutionProvider"], sess_options=sess_options)


def optimize(model_path: Path | str) -> None:
    model_path = Path(model_path)

    optimize_ort(model_path, model_path)
    optimize_onnxsim(model_path, model_path)
