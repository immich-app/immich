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
    from rknnlite.api import RKNNLite, rknn_runtime

    soc_name = get_soc("/proc/device-tree/compatible")
    is_available = soc_name is not None
except ImportError:
    log.debug("RKNN is not available")


class RknnNode(NamedTuple):
    name: str
    shape: tuple[int, ...]


_CUSTOM_STRING_QUERY = 7  # RKNN_QUERY_CUSTOM_STRING
# RKNN_QUERY_OUTPUT_ATTR, and RKNN_QUERY_CURRENT_OUTPUT_ATTR for the shape a dynamic binary last produced
_OUTPUT_QUERY, _CURRENT_OUTPUT_QUERY = 2, 15
_DTYPES = {0: np.float32, 1: np.float16}  # rknn_tensor_type


class _CustomString(ctypes.Structure):
    _fields_ = [("string", ctypes.c_char * 1024)]


class _TensorAttr(ctypes.Structure):  # rknn_tensor_attr
    _fields_ = [
        ("index", ctypes.c_uint32),
        ("n_dims", ctypes.c_uint32),
        ("dims", ctypes.c_uint32 * 16),
        ("name", ctypes.c_char * 256),
        ("n_elems", ctypes.c_uint32),
        ("size", ctypes.c_uint32),
        ("fmt", ctypes.c_int),
        ("type", ctypes.c_int),
        ("qnt_type", ctypes.c_int),
        ("fl", ctypes.c_int8),
        ("zp", ctypes.c_int32),
        ("scale", ctypes.c_float),
        ("w_stride", ctypes.c_uint32),
        ("size_with_stride", ctypes.c_uint32),
        ("pass_through", ctypes.c_uint8),
        ("h_stride", ctypes.c_uint32),
    ]


def native_outputs(rknn_lite: "RKNNLite") -> list[NDArray[Any]]:
    """The outputs in the precision the NPU computed them in, which RKNNLite would widen to fp32 on the CPU."""
    runtime: Any = rknn_lite.rknn_runtime
    count = runtime.get_in_out_num()[1]
    buffers = (rknn_runtime.RKNNOutput * count)()
    for index, buffer in enumerate(buffers):
        buffer.index = index
    if runtime.lib.rknn_outputs_get(runtime.context, count, buffers, None) != 0:
        raise RuntimeError("RKNN inference failed!")
    query = _CURRENT_OUTPUT_QUERY if runtime.is_dynamic_shape else _OUTPUT_QUERY
    outputs = []
    for buffer in buffers:
        attr = _TensorAttr(index=buffer.index)
        runtime.lib.rknn_query(runtime.context, query, ctypes.byref(attr), ctypes.sizeof(attr))
        data = ctypes.cast(buffer.buf, ctypes.POINTER(ctypes.c_char * buffer.size)).contents
        outputs.append(np.frombuffer(data, _DTYPES[attr.type]).reshape(attr.dims[: attr.n_dims]).copy())
    runtime.lib.rknn_outputs_release(runtime.context, count, buffers)
    return outputs


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
