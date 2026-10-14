"""Run OCR on craft-beer and faces on the crowd photo as the server would on this runner, list what differs from the
fixtures, then replay every graph that ran against the CPU, naming the first layers where the provider leaves it."""

import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

os.environ.setdefault("MACHINE_LEARNING_MODEL_REVISION", "v2")
import numpy as np
import onnx
import onnxruntime as ort
from numpy.typing import NDArray
from PIL import Image

import immich_ml.sessions.ort as o
from immich_ml.models.facial_recognition.detection import FaceDetector
from immich_ml.models.facial_recognition.recognition import FaceRecognizer
from immich_ml.models.ocr.detection import TextDetector
from immich_ml.models.ocr.recognition import TextRecognizer
from immich_ml.schemas import (
    FaceDetectionOptions,
    FaceRecognitionOptions,
    ModelInput,
    TextDetectionOptions,
    TextRecognitionOptions,
)

Feed = dict[str, NDArray[Any]]
Outputs = list[NDArray[Any]]

assets = Path(sys.argv[1] if len(sys.argv) > 1 else "../e2e/test-assets")
MODELS = ("PP-OCRv5_server", "PP-OCRv6_medium", "PP-OCRv6_tiny")
DIVERGED = 0.25  # healthy fp16 stays well under this in every layer
providers = o._providers_default()
print(f"providers {providers}, ort {ort.__version__}")

# every graph the pipeline runs off the CPU, with the first input it was given and what the provider made of it
calls: dict[Path, tuple[o.GraphSpec, Feed, Outputs]] = {}


class RecordingGraph(o.OrtGraph):
    def __init__(self, spec: o.GraphSpec) -> None:
        super().__init__(spec)
        self.spec, self.path = spec, o.prepared(spec)

    def infer(self, output_names: list[str] | None, input_feed: ModelInput, run_options: Any = None) -> Outputs:
        out = super().infer(output_names, input_feed, run_options)
        if self.spec.provider != "CPUExecutionProvider":  # a copy: the recognizer refills one buffer for every batch
            calls.setdefault(self.path, (self.spec, {k: np.array(v) for k, v in input_feed.items()}, out))
        return out


o.OrtGraph = RecordingGraph  # type: ignore[misc]


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


def errors(got: Outputs, ref: Outputs) -> str:
    return "; ".join(
        f"rel L2 {relative(g, r):.3g}, {int((~np.isfinite(g)).sum())} nonfinite"
        if np.issubdtype(r.dtype, np.floating)
        else f"{np.mean(g == r):.3f} equal"
        for g, r in zip(got, ref)
    )


def diagnose() -> None:
    selfie = Path("worlds-largest-selfie.jpg").read_bytes()
    for pack in ("buffalo_l", "antelopev2"):
        faces = FaceDetector(pack).predict(selfie, options=FaceDetectionOptions(min_score=0.7))
        embedded = FaceRecognizer(pack).predict(selfie, faces, options=FaceRecognitionOptions())
        bad = [i for i, face in enumerate(embedded) if not np.isfinite(json.loads(face["embedding"])).all()]
        print(f"\n{pack} on the crowd: {len(embedded)} faces, {len(bad)} with a nonfinite embedding {bad[:8]}")

    fixture = json.loads(Path("responses.json").read_text())["ocr"]["bucketed"]
    beer = Image.open(assets / "albums/text/craft-beer.jpg")
    detection = TextDetectionOptions(max_resolution=736, min_score=0.5)
    recognition = TextRecognitionOptions(min_score=0.8)
    for model in MODELS:
        boxes = TextDetector.create(model, detection).predict(beer, options=detection)
        recognizer = TextRecognizer(model)
        texts = recognizer.predict(beer, {k: v.copy() for k, v in boxes.items()}, options=recognition)["text"]
        expected = fixture[model]["text"]
        print(f"\n{model}: {len(boxes['boxes'])} boxes, {len(texts)} lines (fixture {len(expected)})")
        print(f"  missing {[t for t in expected if t not in texts]}")
        print(f"  extra   {[t for t in texts if t not in expected]}")
        o._providers_default = lambda: ["CPUExecutionProvider"]
        cpu_boxes = TextDetector.create(model, detection).predict(beer, options=detection)
        o._providers_default = lambda: providers
        # the CPU's boxes, so the recognizer runs here even where this provider's detector finds none
        recognizer.predict(beer, cpu_boxes, options=recognition)

    for path, (spec, feed, out) in calls.items():
        print(f"\n== {path.relative_to(spec.model_path.parents[3])}  input {[list(v.shape) for v in feed.values()]}")
        ref = run(path, spec, feed, "CPUExecutionProvider")
        print(f"  {spec.provider} (immich): {errors(out, ref)}")
        variants: dict[str, tuple[Path, dict[str, str]]] = (
            {f"cudnn {search}": (path, {"cudnn_conv_algo_search": search}) for search in ("HEURISTIC", "DEFAULT")}
            if spec.provider == "CUDAExecutionProvider"
            else {"precision ACCURACY": (path, {"precision": "ACCURACY"})}
        )
        variants["fp32 source"] = (spec.model_path, {"precision": "FP32"} if "OpenVINO" in spec.provider else {})
        for label, (graph, options) in variants.items():
            try:
                reference = ref if graph == path else run(graph, spec, feed, "CPUExecutionProvider")
                print(f"  {label}: {errors(run(graph, spec, feed, spec.provider, **options), reference)}")
            except Exception as e:  # one variant failing should not cost the rest of the round
                print(f"  {label}: {type(e).__name__}: {str(e)[:200]}")
        layers(path, spec, feed)


def layers(path: Path, spec: o.GraphSpec, feed: Feed) -> None:
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
    on_provider = dict(zip(names, run(probe, spec, feed, spec.provider)))
    on_cpu = dict(zip(names, run(probe, spec, feed, "CPUExecutionProvider")))
    probe.unlink()
    dims = {i.name: list(i.dims) for i in m.graph.initializer}
    ranked = []
    for node in m.graph.node:
        out = node.output[0]
        if out in on_provider and np.issubdtype(on_cpu[out].dtype, np.floating):
            ranked.append((relative(on_provider[out], on_cpu[out]), node))
    diverged = [(rel, node) for rel, node in ranked if rel > DIVERGED][:3]
    print(f"  first layers over {DIVERGED}:" if diverged else f"  no layer over {DIVERGED}; the largest:")
    for rel, node in diverged or sorted(ranked, key=lambda r: -r[0])[:3]:
        attrs = {at.name: onnx.helper.get_attribute_value(at) for at in node.attribute}
        inputs = [list(on_cpu[i].shape) if i in on_cpu else dims.get(i, i) for i in node.input]
        bad = int((~np.isfinite(on_provider[node.output[0]])).sum())
        print(f"    {node.op_type} {node.name} {attrs} inputs {inputs}: rel L2 {rel:.3g}, {bad} nonfinite")


# the server runs no kernel on the thread that imported ORT either
with ThreadPoolExecutor(1) as pool:
    pool.submit(diagnose).result()
