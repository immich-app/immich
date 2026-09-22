from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path
from typing import Any

import numpy as np
import orjson
from numpy.typing import NDArray

from immich_ml.config import log, settings
from immich_ml.schemas import ModelInput, ModelTensor, SessionNode, Shape

from .rknnpool import RknnNode, RknnPoolExecutor, is_available, native_outputs, soc_name

is_available = is_available and settings.rknn
model_prefix = Path("rknpu") / soc_name if is_available and soc_name is not None else None


def model_path(model_dir: Path, variant: str = "") -> Path:
    return (model_dir / model_prefix if model_prefix else model_dir) / variant / "model.rknn"


def run_inference(rknn_lite: Any, inputs: list[ModelTensor], data_format: str | None) -> list[NDArray[np.float32]]:
    rknn_lite.rknn_runtime.set_inputs(inputs, None, data_format)
    rknn_lite.rknn_runtime.run(False)
    return native_outputs(rknn_lite)


def input_layout(compiled: tuple[int, ...], array: ModelTensor) -> str | None:
    if array.ndim != 4:
        return None  # token ids carry no layout
    if array.shape[3] == compiled[3]:
        return "nhwc"
    if array.shape[1] == compiled[3]:
        return "nchw"
    raise ValueError(f"binary takes {compiled[3]} channels, fed {list(array.shape)}")


class RknnSession:
    def __init__(self, model_path: Path) -> None:
        self.tpe = settings.rknn_threads

        log.info(f"Loading RKNN model from {model_path} with {self.tpe} threads.")
        self.rknnpool = RknnPoolExecutor(model_path=model_path.as_posix(), tpes=self.tpe, func=run_inference)
        log.info(f"Loaded RKNN model from {model_path} with {self.tpe} threads.")
        # the shapes the binary was compiled for, among which the runtime routes itself
        batch = self.rknnpool.inputs[0].shape[0]
        declared = orjson.loads(self.rknnpool.custom_string)["dims"] if self.rknnpool.custom_string else [{}]
        self.shapes = tuple(Shape(batch, **dims) for dims in declared)
        self.batches = (batch,)

    def for_shape(self, shape: Shape) -> RknnSession:
        return self

    def warm(self) -> None:
        pass  # the binary is loaded whole when the session opens

    def get_inputs(self) -> Sequence[SessionNode]:
        return self.rknnpool.inputs

    def get_outputs(self) -> Sequence[SessionNode]:
        return self.rknnpool.outputs

    def get_metadata(self) -> dict[str, str]:
        return {}

    @property
    def normalizes_input(self) -> bool:
        # the compiler transposes and casts every binary, so only what the exporter declared can say
        return bool(self.rknnpool.custom_string)

    def run(
        self,
        output_names: list[str] | None,
        input_feed: ModelInput,
        run_options: Any = None,
    ) -> list[NDArray[np.float32]]:
        inputs = [array if array.flags.c_contiguous else array.copy() for array in input_feed.values()]
        return self.rknnpool.run(inputs, input_layout(self.rknnpool.inputs[0].shape, inputs[0]))


__all__ = ["RknnSession", "RknnNode", "is_available", "soc_name", "model_path"]
