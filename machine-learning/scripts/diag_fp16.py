"""Run OCR and face detection on CUDA as the server would, then replay every graph that ran against the CPU and
under other cuDNN settings, naming the first layers where CUDA leaves the CPU."""

import ctypes
import os
import sys
import urllib.request
from pathlib import Path
from typing import Any

os.environ.setdefault("MACHINE_LEARNING_MODEL_REVISION", "v2")
import numpy as np
import onnx
import onnxruntime as ort
from numpy.typing import NDArray
from PIL import Image

import immich_ml.sessions.ort as o

o._providers_default = lambda: ["CUDAExecutionProvider", "CPUExecutionProvider"]
from immich_ml.models.facial_recognition.detection import FaceDetector  # noqa: E402
from immich_ml.models.ocr.detection import TextDetector  # noqa: E402
from immich_ml.models.ocr.recognition import TextRecognizer  # noqa: E402
from immich_ml.schemas import (  # noqa: E402
    FaceDetectionOptions,
    ModelInput,
    TextDetectionOptions,
    TextRecognitionOptions,
)

Feed = dict[str, NDArray[Any]]
Outputs = list[NDArray[Any]]

assets = Path(sys.argv[1] if len(sys.argv) > 1 else "../e2e/test-assets")
GROUP = "https://raw.githubusercontent.com/deepinsight/insightface/master/python-package/insightface/data/images/t1.jpg"
DIVERGED = 0.25  # healthy fp16 stays well under this in every layer

cuda = ctypes.CDLL("libcuda.so.1")
cuda.cuInit(0)
name, major, minor = ctypes.create_string_buffer(100), ctypes.c_int(), ctypes.c_int()
cuda.cuDeviceGetName(name, 100, 0)
cuda.cuDeviceGetAttribute(ctypes.byref(major), 75, 0)
cuda.cuDeviceGetAttribute(ctypes.byref(minor), 76, 0)
cudnn = ctypes.CDLL("libcudnn.so.9").cudnnGetVersion()
print(f"{name.value.decode()} sm{major.value}{minor.value}, cudnn {cudnn}, ort {ort.__version__}")

# every graph the pipeline runs, with the first input it was given and what CUDA made of it
calls: dict[Path, tuple[o.GraphSpec, Feed, Outputs]] = {}


class RecordingGraph(o.OrtGraph):
    def __init__(self, spec: o.GraphSpec) -> None:
        super().__init__(spec)
        self.spec, self.path = spec, o.prepared(spec)

    def infer(self, output_names: list[str] | None, input_feed: ModelInput, run_options: Any = None) -> Outputs:
        out = super().infer(output_names, input_feed, run_options)
        # a copy: the recognizer refills one buffer for every batch
        calls.setdefault(self.path, (self.spec, {k: np.array(v) for k, v in input_feed.items()}, out))
        return out


o.OrtGraph = RecordingGraph  # type: ignore[misc]

beer = Image.open(assets / "albums/text/craft-beer.jpg")
detection = TextDetectionOptions(max_resolution=736, min_score=0.5)
boxes = TextDetector.create("PP-OCRv5_mobile", detection).predict(beer, options=detection)
texts = TextRecognizer("PP-OCRv5_mobile").predict(
    beer, {k: v.copy() for k, v in boxes.items()}, options=TextRecognitionOptions(min_score=0.9)
)
print(f"ocr PP-OCRv5_mobile on craft-beer: {len(boxes['boxes'])} boxes, {len(texts['text'])} texts {texts['text'][:5]}")
group: bytes | None
try:
    group = urllib.request.urlopen(GROUP, timeout=30).read()
except OSError:
    group = None
for label, data in (("portrait", (assets / "metadata/faces/portrait.jpg").read_bytes()), ("group t1", group)):
    if data is not None:
        faces = FaceDetector("buffalo_l").predict(data, options=FaceDetectionOptions(min_score=0.5))
        print(f"faces buffalo_l on {label}: {[round(float(s), 3) for s in faces['scores']]}")


def run(path: Path, spec: o.GraphSpec, feed: Feed, provider: str, **options: str) -> Outputs:
    cpu = provider == "CPUExecutionProvider"
    session = ort.InferenceSession(
        str(path),
        sess_options=spec.sess_options(),
        providers=[provider] if cpu else [provider, "CPUExecutionProvider"],
        provider_options=[{}] if cpu else [{**spec.provider_options[0], **options}, {}],
        disabled_optimizers=spec.disabled_optimizers,
    )
    outputs: Outputs = session.run(None, feed)
    return outputs


def relative(got: NDArray[Any], ref: NDArray[Any]) -> float:
    # a norm, not a maximum, so that a few outlying elements cannot flag a healthy layer
    got, ref = got.astype(np.float64), ref.astype(np.float64)
    diff = np.nan_to_num(got, nan=1e9, posinf=1e9, neginf=1e9) - ref
    return float(np.linalg.norm(diff) / (np.linalg.norm(ref) + 1e-6))


def error(got: NDArray[Any], ref: NDArray[Any]) -> str:
    if not np.issubdtype(ref.dtype, np.floating):
        return f"{np.mean(got == ref):.3f} equal"
    return f"rel err {relative(got, ref):.3g} nonfinite {int((~np.isfinite(got)).sum())}"


def errors(got: Outputs, ref: Outputs) -> str:
    return "; ".join(error(g, r) for g, r in zip(got, ref))


for path, (spec, feed, cuda_out) in calls.items():
    print(f"\n== {path.relative_to(spec.model_path.parents[3])}  input {[list(v.shape) for v in feed.values()]}")
    ref = run(path, spec, feed, "CPUExecutionProvider")
    print(f"  cuda (immich)    : {errors(cuda_out, ref)}")
    variants: dict[str, tuple[Path, dict[str, str]]] = {
        f"cuda {search}": (path, {"cudnn_conv_algo_search": search}) for search in ("HEURISTIC", "DEFAULT")
    }
    variants["cuda fp32 source"] = (spec.model_path, {})
    for label, (graph, cuda_options) in variants.items():
        try:
            reference = ref if graph == path else run(graph, spec, feed, "CPUExecutionProvider")
            got = run(graph, spec, feed, "CUDAExecutionProvider", **cuda_options)
            print(f"  {label:17s}: {errors(got, reference)}")
        except Exception as e:  # one variant failing should not cost the rest of the round
            print(f"  {label:17s}: {type(e).__name__}: {str(e)[:200]}")

    m = onnx.load(str(path), load_external_data=False)
    types = {vi.name: vi.type.tensor_type.elem_type for vi in onnx.shape_inference.infer_shapes(m).graph.value_info}
    have = {out.name for out in m.graph.output}
    for node in m.graph.node:
        for out in node.output:
            if out not in have and types.get(out) in (onnx.TensorProto.FLOAT, onnx.TensorProto.FLOAT16):
                kind = onnx.helper.make_tensor_type_proto(types[out], None)
                m.graph.output.append(onnx.helper.make_value_info(out, kind))
    probe = path.with_name("diag.allouts.onnx")
    onnx.save(m, str(probe))
    names = [out.name for out in m.graph.output]
    on_cuda = dict(zip(names, run(probe, spec, feed, "CUDAExecutionProvider")))
    on_cpu = dict(zip(names, run(probe, spec, feed, "CPUExecutionProvider")))
    probe.unlink()
    dims = {i.name: list(i.dims) for i in m.graph.initializer}
    shown, worst = 0, (0.0, "")
    for node in m.graph.node:
        out = node.output[0]
        if out not in on_cuda or not np.issubdtype(on_cpu[out].dtype, np.floating):
            continue
        rel = relative(on_cuda[out], on_cpu[out])
        worst = max(worst, (rel, f"{node.op_type} {node.name}"))
        if rel > DIVERGED:
            attrs = {at.name: onnx.helper.get_attribute_value(at) for at in node.attribute}
            inputs = [list(on_cpu[i].shape) if i in on_cpu else dims.get(i, i) for i in node.input]
            bad = int((~np.isfinite(on_cuda[out])).sum())
            print(
                f"  diverges at {node.op_type} {node.name} {attrs} inputs {inputs}: rel err {rel:.3g}, {bad} nonfinite"
            )
            shown += 1
            if shown == 3:
                break
    if not shown:
        print(f"  no layer diverges by more than {DIVERGED:.0%}; the most is {worst[0]:.3g} at {worst[1]}")
