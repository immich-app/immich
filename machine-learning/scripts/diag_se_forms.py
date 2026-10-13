"""The PP-OCRv5 detector's merged SE gates written other ways: each form against the CPU and timed, per provider."""

import argparse
import os
import statistics
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

os.environ.setdefault("MACHINE_LEARNING_MODEL_REVISION", "v2")
import numpy as np
import onnx
import onnxruntime as ort
from numpy.typing import NDArray
from onnx import helper, numpy_helper
from PIL import Image

import immich_ml.sessions.ort as o
from immich_ml.models.ocr.detection import TextDetector
from immich_ml.sessions.prepare import prepare

FORMS = ("grouped", "dense", "dense_fold", "gemm_fold")
PROVIDERS = {"cuda": "CUDAExecutionProvider", "rtx": "nv_tensorrt_rtx", "cpu": "CPUExecutionProvider"}


def block_diagonal(w: NDArray[Any], groups: int) -> NDArray[Any]:
    out, per_in = w.shape[:2]
    per_out = out // groups
    dense = np.zeros((out, per_in * groups, 1, 1), w.dtype)
    for g in range(groups):
        dense[g * per_out : (g + 1) * per_out, g * per_in : (g + 1) * per_in] = w[g * per_out : (g + 1) * per_out]
    return dense


def build(src: Path, dst: Path, form: str) -> int:
    model = onnx.load(str(src))
    graph = model.graph
    if form != "grouped":
        rewrite(graph, form)
    dst.mkdir(parents=True, exist_ok=True)
    onnx.save_model(model, str(dst / "model.onnx"), save_as_external_data=True, location="model.data")
    return sum(
        1
        for n in graph.node
        if n.op_type in ("Conv", "Gemm") and any(a.name == "group" and a.i > 1 for a in n.attribute)
    )


def rewrite(graph: onnx.GraphProto, form: str) -> None:
    producer = {out: n for n in graph.node for out in n.output}
    consumers: dict[str, list[onnx.NodeProto]] = {}
    for n in graph.node:
        for i in n.input:
            consumers.setdefault(i, []).append(n)
    inits = {i.name: i for i in graph.initializer}
    nodes = list(graph.node)
    for split in [n for n in nodes if n.op_type == "Split"]:
        gate = producer.get(split.input[0])
        up = producer.get(gate.input[0]) if gate is not None and gate.op_type == "HardSigmoid" else None
        relu = producer.get(up.input[0]) if up is not None and up.op_type == "Conv" else None
        down = producer.get(relu.input[0]) if relu is not None and relu.op_type == "Relu" else None
        if gate is None or up is None or relu is None or down is None or down.op_type != "Conv":
            continue
        groups = next(a.i for a in up.attribute if a.name == "group")
        alpha = next((a.f for a in gate.attribute if a.name == "alpha"), 0.2)
        beta = next((a.f for a in gate.attribute if a.name == "beta"), 0.5)
        adds = [consumers[out][0] for out in split.output]
        one = all(
            a.op_type == "Add"
            and len(consumers[out]) == 1
            and a.input[1] in inits
            and float(numpy_helper.to_array(inits[a.input[1]])) == 1.0
            for a, out in zip(adds, split.output)
        )
        offset = 1.0 if form != "dense" and one else 0.0
        for conv in (down, up):
            w = block_diagonal(numpy_helper.to_array(inits[conv.input[1]]), groups)
            b = numpy_helper.to_array(inits[conv.input[2]])
            if conv is up and form != "dense":  # the gate's affine and the residual's +1, folded in
                w, b = w * alpha, b * alpha + beta + offset
            if form == "gemm_fold":
                w = w[:, :, 0, 0]
            name = f"{conv.name}_{form}"
            graph.initializer.extend([numpy_helper.from_array(w, f"{name}_w"), numpy_helper.from_array(b, f"{name}_b")])
            conv.input[1], conv.input[2] = f"{name}_w", f"{name}_b"
            for attribute in conv.attribute:
                if attribute.name == "group":
                    attribute.i = 1
        if form == "dense":
            continue
        low, high = f"{gate.name}_low", f"{gate.name}_high"
        graph.initializer.extend(
            [
                numpy_helper.from_array(np.array(offset, np.float32), low),
                numpy_helper.from_array(np.array(offset + 1, np.float32), high),
            ]
        )
        clip = helper.make_node("Clip", [gate.input[0], low, high], list(gate.output), name=f"{gate.name}_clip")
        nodes[nodes.index(gate)] = clip
        if offset:
            for add, out in zip(adds, split.output):
                nodes.remove(add)
                for user in consumers[add.output[0]]:
                    user.input[list(user.input).index(add.output[0])] = out
        if form == "gemm_fold":
            for conv in (down, up):
                gemm = helper.make_node(
                    "Gemm",
                    [f"{conv.input[0]}_flat", *conv.input[1:]],
                    [f"{conv.output[0]}_flat"],
                    name=f"{conv.name}_gemm",
                    transB=1,
                )
                flatten = helper.make_node(
                    "Flatten", [conv.input[0]], [f"{conv.input[0]}_flat"], axis=1, name=f"{conv.name}_flatten"
                )
                axes = f"{conv.name}_axes"
                graph.initializer.append(numpy_helper.from_array(np.array([2, 3], np.int64), axes))
                unflatten = helper.make_node(
                    "Unsqueeze", [f"{conv.output[0]}_flat", axes], list(conv.output), name=f"{conv.name}_unsqueeze"
                )
                at = nodes.index(conv)
                nodes[at : at + 1] = [flatten, gemm, unflatten]
    del graph.node[:]
    graph.node.extend(nodes)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("image")
    p.add_argument("--work", required=True)
    p.add_argument("--providers", default="cuda,cpu")
    p.add_argument("--canvas", default="736x1120")
    p.add_argument("--seconds", type=float, default=0.5)
    p.add_argument("--rounds", type=int, default=6)
    args = p.parse_args()
    height, width = (int(v) for v in args.canvas.split("x"))
    det = TextDetector("PP-OCRv5_mobile")
    det.download()
    work = Path(args.work)
    for form in FORMS:
        print(f"{form}: {build(det.model_dir / 'model.onnx', work / form / 'detection', form)} grouped convs left")
    feed = np.asarray(Image.open(args.image).convert("RGB").resize((width, height), Image.Resampling.LANCZOS))[None]
    source = ort.InferenceSession(str(det.model_dir / "model.onnx"), providers=["CPUExecutionProvider"])
    reference = source.run(None, {source.get_inputs()[0].name: feed})[0][0].astype(np.float32)
    print(f"reference cpu fp32 grouped: {len(det.postprocess(reference, (height, width), 0.5)[0])} boxes")
    for key in args.providers.split(","):
        provider = PROVIDERS[key]
        if provider not in ort.get_available_providers():
            print(f"{key}: unavailable")
            continue
        sessions = {}
        for form in FORMS:
            pins = {"batch": 1} if key == "cpu" else {"batch": 1, "height": height, "width": width}
            providers = [provider] if key == "cpu" else [provider, "CPUExecutionProvider"]
            spec = o.GraphSpec(
                work / form / "detection" / "model.onnx",
                pins,
                o._overrides(det.shape_policy, pins),
                providers,
                o._disabled_optimizers_default(providers),
            )
            if (graph := o.fresh(spec)) is None:
                prepare(spec)
                graph = o.fresh(spec)
            assert graph is not None
            sessions[form] = spec.session(graph)
        outputs = {f: s.run(None, {s.get_inputs()[0].name: feed})[0][0].astype(np.float32) for f, s in sessions.items()}
        times: dict[str, list[float]] = {f: [] for f in FORMS}
        rounds: dict[str, list[float]] = {f: [] for f in FORMS}  # each round's median, for the spread of the ratio
        for r in range(args.rounds):
            for f in FORMS[r % len(FORMS) :] + FORMS[: r % len(FORMS)]:
                s, name, end = sessions[f], sessions[f].get_inputs()[0].name, time.perf_counter() + args.seconds
                got: list[float] = []
                while time.perf_counter() < end or len(got) < 3:
                    t = time.perf_counter()
                    s.run(None, {name: feed})
                    got.append(time.perf_counter() - t)
                times[f] += got
                rounds[f].append(statistics.median(got))
        base = statistics.median(times["grouped"])
        for f in FORMS:
            y = outputs[f]
            rel = float(np.linalg.norm(np.nan_to_num(y, nan=1e9) - reference) / np.linalg.norm(reference))
            boxes = len(det.postprocess(y, (height, width), 0.5)[0])
            median = statistics.median(times[f])
            ratios = [a / b for a, b in zip(rounds[f], rounds["grouped"])]
            print(
                f"{key} {f:10s}: rel err {rel:.3g}, {int((~np.isfinite(y)).sum())} nonfinite, {boxes} boxes, "
                f"{1e3 * median:.3f} ms ({median / base:.3f}x grouped, rounds {min(ratios):.3f}-{max(ratios):.3f})"
            )


# the server runs no kernel on the thread that imported ORT either
with ThreadPoolExecutor(1) as pool:
    pool.submit(main).result()
