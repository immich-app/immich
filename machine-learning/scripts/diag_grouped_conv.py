"""The PP-OCRv5 detector's merged SE up-projection as one fp16 Conv, against NumPy, under each cuDNN search mode."""

import ctypes
import tempfile
from pathlib import Path
from typing import Any

import numpy as np
import onnx
import onnxruntime as ort
from numpy.typing import NDArray
from onnx import numpy_helper

# (groups, input channels, output channels, height, width, bias): the failing layer first, then one change each
LAYERS = [
    (4, 96, 384, 1, 1, True),
    (4, 96, 384, 1, 1, False),
    (1, 24, 96, 1, 1, True),
    (4, 96, 384, 2, 2, True),
]

print(f"cudnn {ctypes.CDLL('libcudnn.so.9').cudnnGetVersion()}, ort {ort.__version__}")
rng = np.random.default_rng(0)
with tempfile.TemporaryDirectory() as work:
    for groups, cin, cout, height, width, bias in LAYERS:
        x = rng.uniform(0, 2, (1, cin, height, width)).astype(np.float16)
        w = rng.normal(0, 0.2, (cout, cin // groups, 1, 1)).astype(np.float16)
        b = rng.normal(0, 0.5, cout).astype(np.float16)
        inits = [numpy_helper.from_array(w, "w")] + ([numpy_helper.from_array(b, "b")] if bias else [])
        node = onnx.helper.make_node("Conv", ["x", "w", "b"] if bias else ["x", "w"], ["y"], group=groups)
        graph = onnx.helper.make_graph(
            [node],
            "conv",
            [onnx.helper.make_tensor_value_info("x", onnx.TensorProto.FLOAT16, x.shape)],
            [onnx.helper.make_tensor_value_info("y", onnx.TensorProto.FLOAT16, None)],
            inits,
        )
        path = Path(work) / "conv.onnx"
        onnx.save(onnx.helper.make_model(graph, opset_imports=[onnx.helper.make_opsetid("", 20)]), str(path))

        xg = x.astype(np.float32).reshape(groups, cin // groups, height * width)
        wg = w.astype(np.float32).reshape(groups, cout // groups, cin // groups)
        ref: NDArray[Any] = np.einsum("goi,gip->gop", wg, xg).reshape(1, cout, height, width)
        if bias:
            ref += b.astype(np.float32)[None, :, None, None]

        results = []
        for search in ("EXHAUSTIVE", "HEURISTIC", "DEFAULT"):
            session = ort.InferenceSession(
                str(path), providers=[("CUDAExecutionProvider", {"cudnn_conv_algo_search": search})]
            )
            y = session.run(None, {"x": x})[0].astype(np.float32)
            rel = np.linalg.norm(np.nan_to_num(y, nan=1e9, posinf=1e9, neginf=1e9) - ref) / np.linalg.norm(ref)
            results.append(f"{search} rel err {rel:.3g} nonfinite {int((~np.isfinite(y)).sum())}")
        layer = f"group {groups} {cin}->{cout} at {height}x{width}{' + bias' if bias else ''}"
        print(f"  {layer:30s}: {'; '.join(results)}")
