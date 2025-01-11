from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
from numpy.typing import NDArray

from app.schemas import SessionNode
from rknn.rknnpool import rknnPoolExecutor

from ..config import log, settings


def runInfrence(rknn_lite, input):
    outputs = rknn_lite.inference(inputs=[input], data_format="nchw")

    return outputs


class RknnSession:
    def __init__(self, model_path: Path | str):
        self.model_path = Path(model_path)
        self.ort_model_path = str(self.model_path).replace(".rknn", ".onnx")
        
        if 'textual' in str(self.model_path):
            self.tpe = settings.rknn_textual_threads
        elif 'visual' in str(self.model_path):
            self.tpe = settings.rknn_visual_threads
        else:
            self.tpe = settings.rknn_facial_detection_threads

        log.info(f"Loading RKNN model from {self.model_path} with {self.tpe} threads.")
        self.rknnpool = rknnPoolExecutor(rknnModel=self.model_path.as_posix(), TPEs=self.tpe, func=runInfrence)

        self.ort_session = ort.InferenceSession(
            self.ort_model_path,
        )
        self.inputs = self.ort_session.get_inputs()
        self.outputs = self.ort_session.get_outputs()

        del self.ort_session

    def __del__(self):
        self.rknnpool.release()

    def get_inputs(self) -> list[SessionNode]:
        return self.inputs

    def get_outputs(self) -> list[SessionNode]:
        return self.outputs

    def run(
        self,
        output_names: list[str] | None,
        input_feed: dict[str, NDArray[np.float32]] | dict[str, NDArray[np.int32]],
        run_options: Any = None,
    ):
        input_data = [np.ascontiguousarray(v) for v in input_feed.values()][0]
        self.rknnpool.put(input_data)
        outputs = self.rknnpool.get()[0]
        return outputs
