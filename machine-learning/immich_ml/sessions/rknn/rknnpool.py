# This code is from leafqycc/rknn-multi-threaded
# Following Apache License 2.0

import ctypes
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Callable, NamedTuple

import numpy as np
from numpy.typing import NDArray

from immich_ml.config import log
from immich_ml.models.constants import RKNN_COREMASK_SUPPORTED_SOCS, RKNN_SUPPORTED_SOCS
from immich_ml.schemas import ModelTensor


def get_soc(device_tree_path: Path | str) -> str | None:
    try:
        with Path(device_tree_path).open() as f:
            device_compatible_str = f.read()
            for soc in RKNN_SUPPORTED_SOCS:
                if soc in device_compatible_str:
                    return soc
            log.warning("Device is not supported for RKNN")
    except OSError as e:
        log.warning(f"Could not read {device_tree_path}. Reason: %s", e)
    return None


soc_name = None
is_available = False
try:
    from rknnlite.api import RKNNLite

    soc_name = get_soc("/proc/device-tree/compatible")
    is_available = soc_name is not None
except ImportError:
    log.debug("RKNN is not available")


class RknnNode(NamedTuple):
    name: str
    shape: tuple[int, ...]


_CUSTOM_STRING_QUERY = 7  # RKNN_QUERY_CUSTOM_STRING


class _CustomString(ctypes.Structure):
    _fields_ = [("string", ctypes.c_char * 1024)]


def tensor_nodes(rknn_lite: "RKNNLite") -> tuple[list[RknnNode], list[RknnNode]]:
    runtime = rknn_lite.rknn_runtime
    n_inputs, n_outputs = runtime.get_in_out_num()

    def node(index: int, is_output: bool) -> RknnNode:
        attr = runtime.get_tensor_attr(index, is_output=is_output)
        return RknnNode(attr.name.decode(), tuple(attr.dims[: attr.n_dims]))

    return [node(i, False) for i in range(n_inputs)], [node(i, True) for i in range(n_outputs)]


def custom_string(rknn_lite: "RKNNLite") -> str:
    runtime: Any = rknn_lite.rknn_runtime
    buffer = _CustomString()
    # rknnlite declares argtypes on the shared handle, so pass plain values and let ctypes convert
    runtime.lib.rknn_query(runtime.context, _CUSTOM_STRING_QUERY, ctypes.byref(buffer), ctypes.sizeof(buffer))
    declared: str = buffer.string.decode()
    return declared


def init_rknn(model_path: str) -> "RKNNLite":
    if not is_available:
        raise RuntimeError("rknn is not available!")
    rknn_lite = RKNNLite()
    rknn_lite.rknn_log.logger.setLevel(logging.ERROR)
    ret = rknn_lite.load_rknn(model_path)
    if ret != 0:
        raise RuntimeError("Failed to load RKNN model")

    if soc_name in RKNN_COREMASK_SUPPORTED_SOCS:
        ret = rknn_lite.init_runtime(core_mask=RKNNLite.NPU_CORE_AUTO)
    else:
        ret = rknn_lite.init_runtime()  # Please do not set this parameter on other platforms.

    if ret != 0:
        raise RuntimeError("Failed to initialize RKNN runtime environment")

    return rknn_lite


class RknnPoolExecutor:
    def __init__(
        self,
        model_path: str,
        tpes: int,
        func: Callable[["RKNNLite", list[ModelTensor], str | None], list[NDArray[np.float32]]],
    ) -> None:
        self.tpes = tpes
        self.rknn_pool = [init_rknn(model_path) for _ in range(tpes)]
        self.inputs, self.outputs = tensor_nodes(self.rknn_pool[0])
        self.custom_string = custom_string(self.rknn_pool[0])
        self.pool = ThreadPoolExecutor(max_workers=tpes)
        self.func = func
        self.num = 0
        self.lock = threading.Lock()

    def run(self, inputs: list[ModelTensor], data_format: str | None) -> list[NDArray[np.float32]]:
        with self.lock:
            idx = self.num % self.tpes
            self.num += 1

        fut = self.pool.submit(self.func, self.rknn_pool[idx], inputs, data_format)
        return fut.result()

    def release(self) -> None:
        self.pool.shutdown()
        for rknn_lite in self.rknn_pool:
            rknn_lite.release()

    def __del__(self) -> None:
        self.release()
