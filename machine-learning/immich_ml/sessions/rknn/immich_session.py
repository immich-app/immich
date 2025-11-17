from __future__ import annotations

import queue
import time
from concurrent.futures import Future, ThreadPoolExecutor
from pathlib import Path
from typing import Any, Callable, NamedTuple, Optional, Sequence

import numpy as np
from numpy.typing import NDArray

from immich_ml.config import log, settings
from immich_ml.models.constants import RKNN_SUPPORTED_SOCS

from .native import rknn_pool as _native_mod  # pragma: no cover - compiled extension load

NativeRKNNExecutor = _native_mod.NativeRKNNExecutor  # type: ignore[attr-defined]


__all__ = [
	"RknnSession",
	"RknnPoolExecutor",
	"RknnNode",
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
is_available = bool(soc_name) and getattr(settings, "rknn", True)
model_prefix = Path("rknpu") / soc_name if is_available and soc_name is not None else None


class SessionNode(NamedTuple):
	name: Optional[str]
	shape: tuple[int, ...]


RknnNode = SessionNode


class RKNNInferenceResult(NamedTuple):
	tag: Any
	start_time: float
	end_time: float
	duration_s: float
	outputs: Sequence[Any]


def run_inference(executor: Any, inputs: list[NDArray[np.float32]]) -> list[NDArray[np.float32]]:
	if hasattr(executor, "infer"):
		return executor.infer(inputs)
	if callable(executor):
		return executor(inputs)
	raise RuntimeError("Executor does not support inference")


class RknnPoolExecutor:
	def __init__(
		self,
		model_path: str | Path,
		tpes: int,
		func: Callable[[Any, list[NDArray[np.float32]]], list[NDArray[np.float32]]] | None = None,
	) -> None:
		if tpes < 1:
			raise ValueError("tpes must be >= 1")
		self._model_path = Path(model_path)
		self.tpes = tpes
		self.func = func or run_inference
		self._native = NativeRKNNExecutor(self._model_path.as_posix(), num_workers=tpes)
		self._pool = ThreadPoolExecutor(max_workers=tpes, thread_name_prefix="rknn-worker")
		self._ordered_futures: "queue.Queue[Future]" = queue.Queue()
		self._closed = False

	def submit(self, *inputs: Sequence[Any], tag: Any = None) -> Future:
		if self._closed:
			raise RuntimeError("Pool is closed")
		if not inputs:
			raise ValueError("At least one input tensor must be provided")
		task_inputs = [np.ascontiguousarray(arr) for arr in inputs]

		def _task() -> RKNNInferenceResult:
			start = time.perf_counter()
			outputs = self.func(self._native, task_inputs)
			end = time.perf_counter()
			return RKNNInferenceResult(
				tag=tag,
				start_time=start,
				end_time=end,
				duration_s=end - start,
				outputs=outputs,
			)

		fut = self._pool.submit(_task)
		self._ordered_futures.put(fut)
		return fut

	def put(self, inputs: Sequence[Any], *, tag: Any = None) -> Future:
		return self.submit(*inputs, tag=tag)

	def get(self, *, raw: bool = False, block: bool = False, timeout: Optional[float] = None) -> Any:
		if not block and self._ordered_futures.empty():
			return None
		try:
			fut: Future = self._ordered_futures.get(block=block, timeout=timeout)
		except queue.Empty:
			return None
		result: RKNNInferenceResult = fut.result()
		return result if raw else list(result.outputs)

	def close(self, *, wait: bool = True) -> None:
		if self._closed:
			return
		self._pool.shutdown(wait=wait)
		if hasattr(self._native, "close"):
			try:
				self._native.close()
			except Exception:
				pass
		self._closed = True

	def release(self) -> None:
		self.close()

	def shutdown(self, wait: bool = True) -> None:
		self.close(wait=wait)

	@property
	def executor(self) -> NativeRKNNExecutor:
		return self._native

	def __enter__(self) -> "RknnPoolExecutor":
		return self

	def __exit__(self, exc_type, exc_val, exc_tb) -> None:  # noqa: ANN001
		self.close()

	def __del__(self) -> None:  # pragma: no cover - defensive
		try:
			self.close(wait=False)
		except Exception:
			pass


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
		self.model_type = "detection" if "detection" in self.model_path.parts else "recognition"
		self.log = logger or log
		default_workers = 3 #getattr(settings, "rknn_threads", 1)
		self.tpe = num_workers or default_workers
		if self.tpe < 1:
			raise ValueError("num_workers must be >= 1")
		if self.log:
			self.log.info(
				"Loading RKNN model from %s with %s worker(s).",
				self.model_path,
				self.tpe,
			)
		self.rknnpool = RknnPoolExecutor(self.model_path, self.tpe)
		self._io_info = self._normalize_io_info(self.rknnpool.executor.get_io_info())
		self._input_nodes = self._build_nodes("inputs")
		self._output_nodes = self._build_nodes("outputs")
		if self.log:
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
		output_names: Sequence[str] | None,
		input_feed: dict[str, NDArray[np.float32]] | dict[str, NDArray[np.int32]],
		run_options: Any = None,
	) -> list[NDArray[np.float32]]:
		del output_names, run_options
		if not input_feed:
			raise ValueError("input_feed must not be empty")
		input_data = [np.ascontiguousarray(v) for v in input_feed.values()]
		self.rknnpool.put(input_data)
		outputs = self.rknnpool.get()
		if outputs is None:
			raise RuntimeError("RKNN inference failed – no result available")
		return [np.asarray(out) for out in outputs]

	def close(self) -> None:
		self.rknnpool.close()

	def __del__(self) -> None:  # pragma: no cover - defensive
		try:
			self.close()
		except Exception:
			pass

	def _build_nodes(self, key: str) -> list[SessionNode]:
		entries = self._io_info.get(key, [])
		nodes: list[SessionNode] = []
		for entry in entries:
			nodes.append(SessionNode(name=entry.get("name"), shape=self._shape_from_entry(entry)))
		return nodes

	@staticmethod
	def _shape_from_entry(entry: dict) -> tuple[int, ...]:
		dims = entry.get("dims")
		if dims:
			try:
				return tuple(int(dim) for dim in dims)
			except (TypeError, ValueError):
				return tuple()
		dyn = entry.get("dynamic")
		if isinstance(dyn, dict):
			ranges = dyn.get("ranges")
			if isinstance(ranges, (list, tuple)) and ranges:
				try:
					return tuple(int(dim) for dim in ranges[-1])
				except (TypeError, ValueError):
					return tuple()
		return ()
		return ()

	def _normalize_io_info(self, info: dict[str, Any]) -> dict[str, Any]:
		info = dict(info)
		info["inputs"] = [self._normalize_tensor_desc(tensor) for tensor in info.get("inputs", [])]
		info["outputs"] = [self._normalize_tensor_desc(tensor) for tensor in info.get("outputs", [])]
		return info

	@staticmethod
	def _normalize_tensor_desc(tensor: dict[str, Any]) -> dict[str, Any]:
		desc = dict(tensor)
		desc["dims"] = list(RknnSession._shape_from_entry(tensor))
		desc["n_dims"] = len(desc["dims"])
		# Force NCHW format if the runtime reports NHWC tensors
		if tensor.get("fmt") == 1 and len(desc["dims"]) == 4:
			n, h, w, c = desc["dims"]
			desc["dims"] = [n, c, h, w]
			desc["fmt"] = 0
			dyn = desc.get("dynamic")
			if isinstance(dyn, dict) and "ranges" in dyn:
				new_ranges = []
				for shape in dyn["ranges"]:
					if len(shape) == 4:
						nr = [shape[0], shape[3], shape[1], shape[2]]
						new_ranges.append(nr)
					else:
						new_ranges.append(shape)
				dyn["ranges"] = new_ranges
		return desc


