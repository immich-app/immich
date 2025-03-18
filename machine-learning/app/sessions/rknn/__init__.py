from __future__ import annotations

from pathlib import Path
from typing import Any, NamedTuple

import numpy as np
from numpy.typing import NDArray

from app.config import log, settings
from app.schemas import SessionNode

from .rknnpool import RknnPoolExecutor, is_available, soc_name

is_available = is_available and settings.rknn
model_prefix = Path("rknpu") / soc_name if is_available and soc_name is not None else None


def run_inference(rknn_lite: Any, input: list[NDArray[np.float32]]) -> list[NDArray[np.float32]]:
    outputs: list[NDArray[np.float32]] = rknn_lite.inference(inputs=input, data_format="nchw")
    return outputs


input_output_mapping: dict[str, dict[str, Any]] = {
    "detection": {
        "input": {"norm_tensor:0": (1, 3, 640, 640)},
        "output": {
            "norm_tensor:1": (12800, 1),
            "norm_tensor:2": (3200, 1),
            "norm_tensor:3": (800, 1),
            "norm_tensor:4": (12800, 4),
            "norm_tensor:5": (3200, 4),
            "norm_tensor:6": (800, 4),
            "norm_tensor:7": (12800, 10),
            "norm_tensor:8": (3200, 10),
            "norm_tensor:9": (800, 10),
        },
    },
    "recognition": {"input": {"norm_tensor:0": (1, 3, 112, 112)}, "output": {"norm_tensor:1": (1, 512)}},
}


class RknnSession:
    def __init__(self, model_path: Path) -> None:
        self.model_type = "detection" if "detection" in model_path.parts else "recognition"
        self.tpe = settings.rknn_threads

        log.info(f"Loading RKNN model from {model_path} with {self.tpe} threads.")
        self.rknnpool = RknnPoolExecutor(model_path=model_path.as_posix(), tpes=self.tpe, func=run_inference)
        log.info(f"Loaded RKNN model from {model_path} with {self.tpe} threads.")

    def get_inputs(self) -> list[SessionNode]:
        return [RknnNode(name=k, shape=v) for k, v in input_output_mapping[self.model_type]["input"].items()]

    def get_outputs(self) -> list[SessionNode]:
        return [RknnNode(name=k, shape=v) for k, v in input_output_mapping[self.model_type]["output"].items()]

    def run(
        self,
        output_names: list[str] | None,
        input_feed: dict[str, NDArray[np.float32]] | dict[str, NDArray[np.int32]],
        run_options: Any = None,
    ) -> list[NDArray[np.float32]]:
        input_data: list[NDArray[np.float32]] = [np.ascontiguousarray(v) for v in input_feed.values()]
        self.rknnpool.put(input_data)
        res = self.rknnpool.get()
        if res is None:
            raise RuntimeError("RKNN inference failed!")
        return res


class RknnNode(NamedTuple):
    name: str | None
    shape: tuple[int, ...]


__all__ = ["RknnSession", "RknnNode", "is_available", "soc_name", "model_prefix"]
