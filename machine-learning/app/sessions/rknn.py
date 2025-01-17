from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
from numpy.typing import NDArray

from app.schemas import SessionNode
from rknn.rknnpool import RknnPoolExecutor, soc_name

from ..config import log, settings


def runInfrence(rknn_lite: Any, input: list[NDArray[np.float32]]) -> list[NDArray[np.float32]]:
    outputs: list[NDArray[np.float32]] = rknn_lite.inference(inputs=input, data_format="nchw")

    return outputs


class RknnSession:
    def __init__(self, model_path: Path | str):
        self.model_path = Path(str(model_path).replace("model", soc_name))
        self.ort_model_path = Path(str(self.model_path).replace(f"{soc_name}.rknn", "model.onnx"))

        if "textual" in str(self.model_path):
            self.tpe = settings.rknn_textual_threads
        elif "visual" in str(self.model_path):
            self.tpe = settings.rknn_visual_threads
        else:
            self.tpe = settings.rknn_facial_detection_threads

        log.info(f"Loading RKNN model from {self.model_path} with {self.tpe} threads.")
        self.rknnpool = RknnPoolExecutor(rknnModel=self.model_path.as_posix(), TPEs=self.tpe, func=runInfrence)
        log.info(f"Loaded RKNN model from {self.model_path} with {self.tpe} threads.")

    def __del__(self) -> None:
        self.rknnpool.release()

    def _load_ort_session(self) -> None:
        self.ort_session = ort.InferenceSession(
            self.ort_model_path.as_posix(),
        )
        self.inputs: list[SessionNode] = self.ort_session.get_inputs()
        self.outputs: list[SessionNode] = self.ort_session.get_outputs()
        del self.ort_session

    def get_inputs(self) -> list[SessionNode]:
        try:
            return self.inputs
        except AttributeError:
            self._load_ort_session()
            return self.inputs

    def get_outputs(self) -> list[SessionNode]:
        try:
            return self.outputs
        except AttributeError:
            self._load_ort_session()
            return self.outputs

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
