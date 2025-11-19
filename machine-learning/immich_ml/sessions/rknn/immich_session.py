from __future__ import annotations

import time
from concurrent.futures import Future, ThreadPoolExecutor
from pathlib import Path
from typing import Any, NamedTuple, Optional, Protocol, Sequence

import numpy as np
from numpy.typing import NDArray

from immich_ml.config import log, settings
from immich_ml.models.constants import RKNN_SUPPORTED_SOCS

from .native import rknn_pool as _native_mod  # pragma: no cover - compiled extension load

NativeRKNNExecutor = _native_mod.NativeRKNNExecutor  # type: ignore[attr-defined]


__all__ = [
    "RknnSession",
    "RknnPoolExecutor",
    "run_inference",
    "is_available",
    "soc_name",
    "model_prefix",
]


def get_soc(device_tree_path: Path | str) -> str | None:
    try:
        with Path(device_tree_path).open() as f:
            device_compatible_str = f.read().lower()
            for soc in RKNN_SUPPORTED_SOCS:
                if soc in device_compatible_str:
                    return soc
    except OSError as exc:
        log.debug("Could not read device tree %s: %s", device_tree_path, exc)
    return None


soc_name = get_soc("/proc/device-tree/compatible")
is_available = soc_name is not None and settings.rknn
model_prefix = Path("rknpu") / soc_name if is_available and soc_name else None


class SessionNode(NamedTuple):
    name: Optional[str]
    shape: tuple[int, ...]


class RKNNInferenceResult(NamedTuple):
    tag: Any
    start_time: float
    end_time: float
    duration_s: float
    outputs: list[NDArray[np.float32]]


class InferenceExecutor(Protocol):
    def infer(self, inputs: list[NDArray[np.float32]]) -> list[NDArray[np.float32]]: ...


def run_inference(executor: InferenceExecutor, inputs: list[NDArray[np.float32]]) -> list[NDArray[np.float32]]:
    return executor.infer(inputs)


class RknnPoolExecutor:
    def __init__(self, model_path: str | Path, tpes: int) -> None:
        if tpes < 1:
            raise ValueError("tpes must be >= 1")
        model_path_str = Path(model_path).as_posix()
        self._native = NativeRKNNExecutor(model_path_str, num_workers=tpes)
        self._executor = ThreadPoolExecutor(max_workers=tpes, thread_name_prefix="rknn-worker")
        self._closed = False

    def _run_inference(self, inputs: list[NDArray[np.float32]], tag: Any) -> RKNNInferenceResult:
        start = time.perf_counter()
        outputs = self._native.infer(inputs)
        end = time.perf_counter()
        return RKNNInferenceResult(
            tag=tag,
            start_time=start,
            end_time=end,
            duration_s=end - start,
            outputs=outputs,
        )

    def submit(self, *inputs: Sequence[NDArray[np.float32]], tag: Any = None) -> Future[RKNNInferenceResult]:
        if self._closed:
            raise RuntimeError("Pool is closed")
        return self._executor.submit(self._run_inference, list(inputs), tag)

    def put(self, inputs: Sequence[NDArray[np.float32]], *, tag: Any = None) -> Future[RKNNInferenceResult]:
        return self.submit(*inputs, tag=tag)

    def close(self, *, wait: bool = True) -> None:
        if self._closed:
            return
        self._closed = True
        self._executor.shutdown(wait=wait)

    @property
    def executor(self) -> NativeRKNNExecutor:
        return self._native

    def __enter__(self) -> "RknnPoolExecutor":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:  # noqa: ANN001
        self.close()


class RknnSession:
    def __init__(
        self,
        model_path: Path | str,
        *,
        num_workers: Optional[int] = None,
        logger: Any = None,
    ) -> None:
        if not is_available:
            raise RuntimeError("RKNN is not available on this device")
        self.model_path = Path(model_path)
        self.log = logger or log
        default_workers = getattr(settings, "rknn_threads", 1)
        self.tpe = num_workers or default_workers
        if self.tpe < 1:
            raise ValueError("num_workers must be >= 1")
        self.log.info(
            "Loading RKNN model from %s with %s worker(s).",
            self.model_path,
            self.tpe,
        )
        self.rknnpool = RknnPoolExecutor(self.model_path, self.tpe)
        self._io_info = self._normalize_io_info(self.rknnpool.executor.get_io_info())
        self._input_nodes = self._build_nodes("inputs")
        self._output_nodes = self._build_nodes("outputs")
        self.log.info("Loaded RKNN model from %s.", self.model_path)

    @property
    def io_info(self) -> dict:
        return self._io_info

    def get_inputs(self) -> list[SessionNode]:
        return self._input_nodes

    def get_outputs(self) -> list[SessionNode]:
        return self._output_nodes

    def run(
        self,
        _output_names: Sequence[str] | None,
        input_feed: dict[str, NDArray[np.float32]] | dict[str, NDArray[np.int32]],
        _run_options: Any = None,
    ) -> list[NDArray[np.float32]]:
        return self.run_async(_output_names, input_feed, _run_options).result().outputs

    def run_async(
        self,
        _output_names: Sequence[str] | None,
        input_feed: dict[str, NDArray[np.float32]] | dict[str, NDArray[np.int32]],
        _run_options: Any = None,
    ) -> Future[RKNNInferenceResult]:
        return self.rknnpool.put(list(input_feed.values()))

    def close(self) -> None:
        self.rknnpool.close()

    def _build_nodes(self, key: str) -> list[SessionNode]:
        return [
            SessionNode(name=entry.get("name"), shape=self._shape_from_entry(entry))
            for entry in self._io_info.get(key, [])
        ]

    @staticmethod
    def _shape_from_entry(entry: dict[str, Any]) -> tuple[int, ...]:
        if dims := entry.get("dims"):
            return tuple(int(dim) for dim in dims)
        dyn = entry.get("dynamic", {})
        ranges = dyn.get("ranges", [])
        if ranges:
            return tuple(int(dim) for dim in ranges[-1])
        raise ValueError(f"Cannot determine shape from entry: {entry}")

    def _normalize_io_info(self, info: dict[str, Any]) -> dict[str, Any]:
        return {
            **info,
            "inputs": [self._normalize_tensor_desc(t) for t in info.get("inputs", [])],
            "outputs": [self._normalize_tensor_desc(t) for t in info.get("outputs", [])],
        }

    @staticmethod
    def _normalize_tensor_desc(tensor: dict[str, Any]) -> dict[str, Any]:
        dims = list(RknnSession._shape_from_entry(tensor))
        desc = {**tensor, "dims": dims, "n_dims": len(dims)}
        # Force NCHW format if the runtime reports NHWC tensors
        if tensor.get("fmt") == 1 and len(dims) == 4:
            n, h, w, c = dims
            desc["dims"] = [n, c, h, w]
            desc["fmt"] = 0
            dyn = desc.get("dynamic", {})
            if "ranges" in dyn:
                dyn["ranges"] = [
                    [shape[0], shape[3], shape[1], shape[2]] if len(shape) == 4 else shape for shape in dyn["ranges"]
                ]
        return desc
