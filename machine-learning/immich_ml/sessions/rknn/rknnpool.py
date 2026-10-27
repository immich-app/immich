import ctypes
from concurrent.futures import ThreadPoolExecutor
from ctypes import byref, sizeof
from pathlib import Path
from queue import SimpleQueue
from typing import Any, NamedTuple

import numpy as np
from numpy.typing import NDArray

from immich_ml.config import log
from immich_ml.models.constants import RKNN_NPU_CORES
from immich_ml.schemas import ModelTensor


def get_soc(device_tree_path: Path | str) -> str | None:
    try:
        with Path(device_tree_path).open() as f:
            device_compatible_str = f.read()
            for soc in RKNN_NPU_CORES:
                if soc in device_compatible_str:
                    return soc
            log.warning("Device is not supported for RKNN")
    except OSError as e:
        log.warning(f"Could not read {device_tree_path}. Reason: %s", e)
    return None


class RknnNode(NamedTuple):
    name: str
    shape: tuple[int, ...]


# rknn_query_cmd
_IN_OUT_NUM, _INPUT_ATTR, _OUTPUT_ATTR, _CUSTOM_STRING = 0, 1, 2, 7
_INPUT_DYNAMIC_RANGE, _CURRENT_OUTPUT_ATTR = 13, 15
# rknn_tensor_format
_NCHW, _NHWC = 0, 1
# rknn_tensor_type, in enum order
_DTYPES: list[type[np.generic]] = [
    np.float32,
    np.float16,
    np.int8,
    np.uint8,
    np.int16,
    np.uint16,
    np.int32,
    np.uint32,
    np.int64,
    np.bool_,
]
_TYPES = {np.dtype(dtype): index for index, dtype in enumerate(_DTYPES)}


class _IoNum(ctypes.Structure):
    _fields_ = [("n_input", ctypes.c_uint32), ("n_output", ctypes.c_uint32)]


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


class _InputRange(ctypes.Structure):
    _fields_ = [
        ("index", ctypes.c_uint32),
        ("shape_number", ctypes.c_uint32),
        ("fmt", ctypes.c_int),
        ("name", ctypes.c_char * 256),
        ("dyn_range", (ctypes.c_uint32 * 16) * 512),
        ("n_dims", ctypes.c_uint32),
    ]


class _Input(ctypes.Structure):
    _fields_ = [
        ("index", ctypes.c_uint32),
        ("buf", ctypes.c_void_p),
        ("size", ctypes.c_uint32),
        ("pass_through", ctypes.c_uint8),
        ("type", ctypes.c_int),
        ("fmt", ctypes.c_int),
    ]


class _Output(ctypes.Structure):
    _fields_ = [
        ("want_float", ctypes.c_uint8),
        ("is_prealloc", ctypes.c_uint8),
        ("index", ctypes.c_uint32),
        ("buf", ctypes.c_void_p),
        ("size", ctypes.c_uint32),
    ]


_Key = tuple[tuple[int, ...], ...]
_Spec = tuple[tuple[int, ...], np.dtype[Any]]
_context = ctypes.c_uint64  # rknn_context on 64-bit
_ctx_p = ctypes.POINTER(_context)
_u32 = ctypes.c_uint32

soc_name = None
is_available = False
try:
    lib = ctypes.CDLL("librknnrt.so")  # CDLL releases the GIL for each call, so contexts run in parallel
    lib.rknn_init.argtypes = _ctx_p, ctypes.c_char_p, _u32, _u32, ctypes.c_void_p
    lib.rknn_dup_context.argtypes = _ctx_p, _ctx_p
    lib.rknn_destroy.argtypes = (_context,)
    lib.rknn_query.argtypes = _context, ctypes.c_int, ctypes.c_void_p, _u32
    lib.rknn_set_input_shapes.argtypes = _context, _u32, ctypes.POINTER(_TensorAttr)
    lib.rknn_inputs_set.argtypes = _context, _u32, ctypes.POINTER(_Input)
    lib.rknn_run.argtypes = _context, ctypes.c_void_p
    lib.rknn_outputs_get.argtypes = _context, _u32, ctypes.POINTER(_Output), ctypes.c_void_p
    lib.rknn_outputs_release.argtypes = _context, _u32, ctypes.POINTER(_Output)

    soc_name = get_soc("/proc/device-tree/compatible")
    is_available = soc_name is not None
except OSError:
    log.debug("RKNN is not available")


def _check(ret: int, call: str) -> None:
    if ret != 0:
        raise RuntimeError(f"{call} failed with RKNN error {ret}")


def _query(ctx: int, cmd: int, info: ctypes.Structure) -> None:
    _check(lib.rknn_query(ctx, cmd, byref(info), sizeof(info)), "rknn_query")


def _attr(ctx: int, cmd: int, index: int) -> _TensorAttr:
    attr = _TensorAttr(index=index)
    _query(ctx, cmd, attr)
    return attr


def _specs(attrs: list[_TensorAttr]) -> list[_Spec]:
    return [(tuple(attr.dims[: attr.n_dims]), np.dtype(_DTYPES[attr.type])) for attr in attrs]


class RknnPoolExecutor:
    """One context per thread, all but the first duplicated from it so that they share its weights.

    The model is loaded by path rather than from a buffer, so the runtime holds the only copy of it."""

    def __init__(self, model_path: str, tpes: int) -> None:
        self.contexts: list[int] = []
        self.executor = ThreadPoolExecutor(tpes, thread_name_prefix="rknn")
        master = _context()
        _check(lib.rknn_init(byref(master), model_path.encode(), 0, 0, None), "rknn_init")
        self.contexts.append(master.value)
        for _ in range(tpes - 1):
            child = _context()
            _check(lib.rknn_dup_context(byref(master), byref(child)), "rknn_dup_context")
            self.contexts.append(child.value)
        self.idle: SimpleQueue[int] = SimpleQueue()
        for ctx in self.contexts:
            self.idle.put(ctx)

        io = _IoNum()
        _query(master.value, _IN_OUT_NUM, io)
        self.input_attrs = [_attr(master.value, _INPUT_ATTR, i) for i in range(io.n_input)]
        self.output_attrs = [_attr(master.value, _OUTPUT_ATTR, i) for i in range(io.n_output)]
        self.inputs = [RknnNode(a.name.decode(), tuple(a.dims[: a.n_dims])) for a in self.input_attrs]
        self.outputs = [RknnNode(a.name.decode(), tuple(a.dims[: a.n_dims])) for a in self.output_attrs]
        custom = _CustomString()
        lib.rknn_query(master.value, _CUSTOM_STRING, byref(custom), sizeof(custom))
        self.custom_string = custom.string.decode()

        ranges = [_InputRange(index=index) for index in range(io.n_input)]
        for rng in ranges:
            lib.rknn_query(master.value, _INPUT_DYNAMIC_RANGE, byref(rng), sizeof(rng))
        self.formats = [rng.fmt for rng in ranges]
        self.compiled = [{tuple(rng.dyn_range[i][: rng.n_dims]) for i in range(rng.shape_number)} for rng in ranges]
        self.dynamic = any(self.compiled)
        self.shape_attrs: dict[_Key, ctypes.Array[_TensorAttr]] = {}
        self.output_specs: dict[_Key, list[_Spec]] = {(): _specs(self.output_attrs)}
        self.current: dict[int, _Key] = {}

    def run(self, inputs: list[ModelTensor], data_format: str | None) -> list[NDArray[Any]]:
        return self.executor.submit(self._next, inputs, data_format).result()

    def _next(self, inputs: list[ModelTensor], data_format: str | None) -> list[NDArray[Any]]:
        ctx = self.idle.get()
        try:
            return self._run(ctx, inputs, data_format)
        finally:
            self.idle.put(ctx)

    def _run(self, ctx: int, inputs: list[ModelTensor], data_format: str | None) -> list[NDArray[Any]]:
        fed: list[NDArray[Any]] = [
            np.ascontiguousarray(array.transpose(0, 2, 3, 1) if data_format == "nchw" and array.ndim == 4 else array)
            for array in inputs
        ]
        key = self._set_shapes(ctx, fed) if self.dynamic else ()
        feed = (_Input * len(fed))(
            *(
                _Input(index=i, buf=array.ctypes.data, size=array.nbytes, type=_TYPES[array.dtype], fmt=_NHWC)
                for i, array in enumerate(fed)
            )
        )
        _check(lib.rknn_inputs_set(ctx, len(fed), feed), "rknn_inputs_set")
        _check(lib.rknn_run(ctx, None), "rknn_run")

        specs = self.output_specs.get(key)
        if specs is None:
            attrs = [_attr(ctx, _CURRENT_OUTPUT_ATTR, i) for i in range(len(self.output_attrs))]
            specs = self.output_specs[key] = _specs(attrs)
        outputs = [np.empty(dims, dtype) for dims, dtype in specs]
        buffers = (_Output * len(outputs))(
            *(
                _Output(is_prealloc=1, index=i, buf=array.ctypes.data, size=array.nbytes)
                for i, array in enumerate(outputs)
            )
        )
        _check(lib.rknn_outputs_get(ctx, len(outputs), buffers, None), "rknn_outputs_get")
        lib.rknn_outputs_release(ctx, len(outputs), buffers)
        return outputs

    def _set_shapes(self, ctx: int, inputs: list[NDArray[Any]]) -> _Key:
        key = tuple(
            self._compiled_shape(fmt, compiled, array.shape)
            for fmt, compiled, array in zip(self.formats, self.compiled, inputs)
        )
        if self.current.get(ctx) == key:
            return key
        attrs = self.shape_attrs.get(key)
        if attrs is None:
            attrs = self.shape_attrs[key] = (_TensorAttr * len(key))()
            for i, (source, compiled, fmt, shape) in enumerate(zip(self.input_attrs, self.compiled, self.formats, key)):
                attrs[i] = _TensorAttr.from_buffer_copy(source)
                if compiled:
                    attrs[i].n_dims = len(shape)
                    attrs[i].dims[: len(shape)] = shape
                    attrs[i].fmt = fmt
        _check(lib.rknn_set_input_shapes(ctx, len(key), attrs), "rknn_set_input_shapes")
        self.current[ctx] = key
        return key

    @staticmethod
    def _compiled_shape(fmt: int, compiled: set[tuple[int, ...]], fed: tuple[int, ...]) -> tuple[int, ...]:
        shape = (fed[0], fed[3], fed[1], fed[2]) if len(fed) == 4 and fmt == _NCHW else fed
        if compiled and shape not in compiled:
            raise ValueError(f"binary was compiled for {sorted(compiled)}, fed {list(fed)}")
        return shape

    def release(self) -> None:
        self.executor.shutdown()
        for ctx in reversed(self.contexts):  # duplicates before the context whose weights they share
            lib.rknn_destroy(ctx)
        self.contexts = []

    def __del__(self) -> None:
        self.release()
