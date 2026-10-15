"""Every engine cuDNN's heuristics offer for the convolutions that break on Turing, built as ORT builds them (fp16 data,
fp32 compute, the convolution alone) in NCHW and in prefer_nhwc's NHWC, and run on random, zero and one inputs against
an fp32 reference: which engines are wrong, and how. Needs nvidia-cudnn-frontend, numpy and the CUDA runtime on
LD_LIBRARY_PATH. Run: diag_engines.py <the nvidia-cudnn-cu12 version it must load>."""

import ctypes
import sys
from typing import Any

import cudnn
import numpy as np
from numpy.typing import NDArray

# name, input, weight, stride, padding: the first layers that left the CPU on the 1660, and a batch-1 control
CASES = [
    ("face rec Conv_3, batch 1", (1, 64, 112, 112), (64, 64, 3, 3), 1, 1),
    ("face rec Conv_3, batch 4", (4, 64, 112, 112), (64, 64, 3, 3), 1, 1),
    ("PP-OCRv5_server det node_Conv_81", (1, 256, 184, 280), (64, 256, 3, 3), 1, 1),
    ("PP-OCRv6_medium det node_Conv_3", (1, 128, 368, 560), (64, 128, 3, 3), 2, 1),
    ("PP-OCRv6_medium rec node_Conv_9", (6, 128, 24, 112), (64, 128, 3, 3), 2, 1),
    ("PP-OCRv5_mobile det merged SE up (grouped)", (1, 96, 1, 1), (384, 24, 1, 1), 1, 0),
]
MODES = {cudnn.heur_mode.A: 4, cudnn.heur_mode.B: 4}  # the first few of each list

cudart = ctypes.CDLL("libcudart.so.12")
cudart.cudaGetErrorName.restype = ctypes.c_char_p
cudart.cudaMalloc.argtypes = [ctypes.POINTER(ctypes.c_void_p), ctypes.c_size_t]
cudart.cudaMemcpy.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_int]
cudart.cudaFree.argtypes = [ctypes.c_void_p]


def cuda(status: int) -> None:
    if status:
        raise RuntimeError(cudart.cudaGetErrorName(status).decode())


class Buffer:
    def __init__(self, nbytes: int) -> None:
        self.ptr = ctypes.c_void_p()
        cuda(cudart.cudaMalloc(ctypes.byref(self.ptr), max(nbytes, 1)))

    def put(self, array: NDArray[Any]) -> None:
        cuda(cudart.cudaMemcpy(self.ptr, array.ctypes.data, array.nbytes, 1))

    def get(self, shape: tuple[int, ...]) -> NDArray[np.float16]:
        out = np.empty(shape, np.float16)
        cuda(cudart.cudaMemcpy(out.ctypes.data, self.ptr, out.nbytes, 2))
        return out

    def __del__(self) -> None:
        cudart.cudaFree(self.ptr)


def strides(dims: tuple[int, ...], nhwc: bool) -> list[int]:
    n, c, h, w = dims
    return [c * h * w, 1, w * c, c] if nhwc else [c * h * w, h * w, w, 1]


def laid(array: NDArray[np.float16], nhwc: bool) -> NDArray[np.float16]:
    return np.ascontiguousarray(array.transpose(0, 2, 3, 1)) if nhwc else array


def reference(x: NDArray[np.float16], w: NDArray[np.float16], stride: int, pad: int) -> NDArray[np.float32]:
    """The convolution in fp32 from the same fp16 values, a few rows at a time so that it stays small."""
    n, c, height, width = x.shape
    k, per_group, r, s = w.shape
    groups, outs = c // per_group, k // (c // per_group)
    padded = np.pad(x.astype(np.float32), ((0, 0), (0, 0), (pad, pad), (pad, pad)))
    windows = np.lib.stride_tricks.sliding_window_view(padded, (r, s), axis=(2, 3))[:, :, ::stride, ::stride]
    ho, wo = windows.shape[2:4]
    out = np.empty((n, k, ho, wo), np.float32)
    rows = max(1, int(1.6e7 // (wo * per_group * r * s)))
    for g in range(groups):
        weights = w[g * outs : (g + 1) * outs].astype(np.float32).reshape(outs, -1)
        for i in range(n):
            for top in range(0, ho, rows):
                patch = windows[i, g * per_group : (g + 1) * per_group, top : top + rows]
                columns = patch.transpose(1, 2, 0, 3, 4).reshape(-1, per_group * r * s)
                out[i, g * outs : (g + 1) * outs, top : top + rows] = (columns @ weights.T).T.reshape(outs, -1, wo)
    return out


def spans(indices: NDArray[np.intp], shown: int = 6) -> str:
    """Sorted indices as ranges, the first few of them."""
    if not len(indices):
        return "none"
    breaks = np.flatnonzero(np.diff(indices) != 1)
    starts, ends = np.r_[indices[0], indices[breaks + 1]], np.r_[indices[breaks], indices[-1]]
    text = ", ".join(f"{a}" if a == b else f"{a}-{b}" for a, b in zip(starts[:shown], ends[:shown]))
    return text + (f", … ({len(starts)} ranges)" if len(starts) > shown else "")


def verdict(got: NDArray[np.float16], ref: NDArray[np.float32]) -> tuple[bool, str]:
    out = got.astype(np.float32)
    bad = ~np.isfinite(out)
    rms = float(np.sqrt(np.mean(ref**2)))
    off = ~bad & (np.abs(out - ref) > 1e-2 * rms + 2e-3 * np.abs(ref) + 1e-3)  # fp16 rounding stays well inside
    wrong = bad | off
    if not wrong.any():
        return True, "ok"
    n, k, ho, wo = out.shape
    rows = wrong.transpose(0, 2, 3, 1).reshape(-1, k)  # the implicit GEMM's view: positions x channels
    text = f"{int(bad.sum())} nonfinite + {int(off.sum())} finite but off, of {out.size}"
    text += f"; channels {spans(np.flatnonzero(rows.any(0)))}"
    text += f"; positions (n*h*w) {spans(np.flatnonzero(rows.any(1)))}, {int(rows.all(1).sum())} with every channel"
    if not bad.any():
        text += f"; worst |err| {float(np.abs(out - ref).max()):.3g} (ref rms {rms:.3g})"
    return False, text


def graph(
    handle: int,
    xs: tuple[int, ...],
    ws: tuple[int, ...],
    ys: tuple[int, ...],
    stride: int,
    pad: int,
    mode: Any,
    nhwc: bool,
) -> tuple[Any, dict[str, int]]:
    half = cudnn.data_type.HALF
    g = cudnn.pygraph(
        io_data_type=half, intermediate_data_type=half, compute_data_type=cudnn.data_type.FLOAT, handle=handle
    )
    x = g.tensor(name="x", dim=list(xs), stride=strides(xs, nhwc), data_type=half)
    w = g.tensor(name="w", dim=list(ws), stride=strides(ws, nhwc), data_type=half)
    y = g.conv_fprop(
        image=x,
        weight=w,
        padding=[pad, pad],
        stride=[stride, stride],
        dilation=[1, 1],
        compute_data_type=cudnn.data_type.FLOAT,
        name="conv",
    )
    y.set_output(True).set_dim(list(ys)).set_stride(strides(ys, nhwc))
    g.validate()
    g.build_operation_graph()
    g.create_execution_plans([mode])
    return g, {"x": x.get_uid(), "w": w.get_uid(), "y": y.get_uid()}


def main() -> None:
    cuda(cudart.cudaGetLastError())  # nothing should be pending, but a stale error would be blamed on the first launch
    # the frontend loads the first cuDNN it finds, which need not be the one ORT runs on
    major, minor, patch = (int(part) for part in sys.argv[1].split(".")[:3])
    if cudnn.backend_version() != major * 10000 + minor * 100 + patch:
        raise SystemExit(f"loaded cuDNN {cudnn.backend_version()}, not {sys.argv[1]}")
    print(f"cudnn backend {cudnn.backend_version()}, frontend {cudnn.__version__}")
    handle = cudnn.create_handle()
    rng = np.random.default_rng(0)
    for name, xs, ws, stride, pad in CASES:
        n, c, height, width = xs
        k, per_group, r, s = ws
        ys = (n, k, (height + 2 * pad - r) // stride + 1, (width + 2 * pad - s) // stride + 1)
        w = (rng.standard_normal(ws) / np.sqrt(per_group * r * s)).astype(np.float16)
        inputs = {
            "random": rng.standard_normal(xs).astype(np.float16),
            "zeros": np.zeros(xs, np.float16),
            "ones": np.ones(xs, np.float16),
        }
        refs = {label: reference(x, w, stride, pad) for label, x in inputs.items()}
        xb, wb, yb = Buffer(int(np.prod(xs)) * 2), Buffer(w.nbytes), Buffer(int(np.prod(ys)) * 2)
        print(f"\n== {name}: x {list(xs)} w {list(ws)} stride {stride} pad {pad} -> y {list(ys)}")
        for layout, nhwc in (("NCHW", False), ("NHWC", True)):  # NHWC strides, as prefer_nhwc has ORT build it
            wb.put(laid(w, nhwc))
            got_shape = (n, ys[2], ys[3], k) if nhwc else ys
            for mode, limit in MODES.items():
                # the tensor-core engines are the ones ORT's use_tf32=0 deselects, for half precision too
                plans, uids = graph(handle, xs, ws, ys, stride, pad, mode, nhwc)
                plans.deselect_numeric_notes([cudnn.numerical_note.TENSOR_CORE])
                everything: tuple[Any, dict[str, int]] | None = None
                picks: dict[str, int] = {}
                count = plans.get_execution_plan_count()
                print(f"  {layout}, {mode.name}: {count} engine configs")
                for index in range(count):
                    past = index >= limit  # past the first few, only the engine use_tf32=0 would run is worth a look
                    if past and "use_tf32=0" in picks:
                        break
                    engine = plans.get_plan_name_at_index(index)
                    built, built_uids, tensor_core = plans, uids, False
                    try:
                        plans.build_plan_at_index(index)
                    except Exception as e:
                        if "Deselecting" not in str(e):
                            print(f"    {index:2} {engine}: does not build ({str(e).splitlines()[0][:100]})")
                            continue
                        if past:
                            continue
                        tensor_core = True
                        everything = everything or graph(handle, xs, ws, ys, stride, pad, mode, nhwc)
                        built, built_uids = everything
                        try:
                            built.build_plan_at_index(index)
                        except Exception as e:
                            error = str(e).splitlines()[0][:100]
                            print(f"    {index:2} {engine} [tensor core]: does not build ({error})")
                            continue
                    picks.setdefault("ORT default", index)
                    if not tensor_core:
                        picks.setdefault("use_tf32=0", index)
                    workspace = Buffer(built.get_workspace_size_plan_at_index(index))
                    results = []
                    for label, x in inputs.items():
                        xb.put(laid(x, nhwc))
                        pack = {built_uids[t]: buffer.ptr.value for t, buffer in (("x", xb), ("w", wb), ("y", yb))}
                        try:
                            built._execute_plan_at_index(pack, workspace.ptr.value, index, None)
                            cuda(cudart.cudaDeviceSynchronize())
                            cuda(cudart.cudaGetLastError())
                            got = yb.get(got_shape)
                            results.append((label, *verdict(got.transpose(0, 3, 1, 2) if nhwc else got, refs[label])))
                        except Exception as e:
                            results.append((label, False, f"{type(e).__name__}: {str(e).splitlines()[0][:120]}"))
                    tag = " [tensor core]" if tensor_core else ""
                    if all(ok for _, ok, _ in results):
                        print(f"    {index:2} {engine}{tag}: ok")
                    else:
                        print(f"    {index:2} {engine}{tag}: WRONG")
                        for label, ok, text in results:
                            print(f"         {label}: {text}")
                print(f"    picked: {picks}")


main()
