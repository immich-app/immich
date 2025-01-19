from __future__ import annotations

from pathlib import Path
from typing import Any, NamedTuple

import numpy as np
from numpy.typing import NDArray

from app.schemas import SessionNode
from rknn.rknnpool import RknnPoolExecutor, soc_name

from ..config import log, settings


def runInference(rknn_lite: Any, input: list[NDArray[np.float32]]) -> list[NDArray[np.float32]]:
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
    def __init__(self, model_path: Path | str):
        self.model_path = Path(str(model_path).replace("model", soc_name))
        self.model_type = "detection" if "detection" in self.model_path.as_posix() else "recognition"
        self.tpe = settings.rknn_threads

        log.info(f"Loading RKNN model from {self.model_path} with {self.tpe} threads.")
        self.rknnpool = RknnPoolExecutor(rknnModel=self.model_path.as_posix(), tpes=self.tpe, func=runInference)
        log.info(f"Loaded RKNN model from {self.model_path} with {self.tpe} threads.")

    def __del__(self) -> None:
        self.rknnpool.release()

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
        outputs: list[NDArray[np.float32]] = self.rknnpool.get()
        return outputs


class RknnNode(NamedTuple):
    name: str | None
    shape: tuple[int, ...]
