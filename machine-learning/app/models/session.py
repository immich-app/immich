from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
from numpy.typing import NDArray
from onnx.shape_inference import infer_shapes
from onnx.tools.update_model_dims import update_inputs_outputs_dims


def ort_has_batch_dim(session: ort.InferenceSession) -> bool:
    return session.get_inputs()[0].shape[0] == "batch"


def ort_expand_outputs(session: ort.InferenceSession) -> None:
    original_run = session.run

    def run(output_names: list[str], input_feed: dict[str, NDArray[np.float32]]) -> list[NDArray[np.float32]]:
        out: list[NDArray[np.float32]] = original_run(output_names, input_feed)
        out = [np.expand_dims(o, axis=0) for o in out]
        return out

    session.run = run


def ort_add_batch_dim(input_path: Path, output_path: Path) -> None:
    proto = onnx.load(input_path)
    static_input_dims = [shape.dim_value for shape in proto.graph.input[0].type.tensor_type.shape.dim[1:]]
    static_output_dims = [shape.dim_value for shape in proto.graph.output[0].type.tensor_type.shape.dim[1:]]
    input_dims = {proto.graph.input[0].name: ["batch"] + static_input_dims}
    output_dims = {proto.graph.output[0].name: ["batch"] + static_output_dims}
    updated_proto = update_inputs_outputs_dims(proto, input_dims, output_dims)
    inferred = infer_shapes(updated_proto)
    onnx.save(inferred, output_path)
