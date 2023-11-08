from pathlib import Path

import onnx
import onnxruntime as ort
import onnxsim


def optimize_onnxsim(model_path: Path | str, output_path: Path | str) -> None:
    model_path = Path(model_path)
    output_path = Path(output_path)
    model = onnx.load(model_path.as_posix())
    model, check = onnxsim.simplify(model, skip_shape_inference=True)
    assert check, "Simplified ONNX model could not be validated"
    onnx.save(model, output_path.as_posix())


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
    # onnxsim serializes large models as a blob, which uses much more memory when loading the model at runtime
    if not any(file.name.startswith("Constant") for file in model_path.parent.iterdir()):
        optimize_onnxsim(model_path, model_path)
