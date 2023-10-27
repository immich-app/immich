from pathlib import Path

import onnxruntime as ort


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
