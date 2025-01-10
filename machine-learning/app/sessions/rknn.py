from __future__ import annotations

from pathlib import Path
from typing import Any, List

import numpy as np
import onnxruntime as ort
from numpy.typing import NDArray
from rknnlite.api import RKNNLite


from app.models.constants import SUPPORTED_PROVIDERS
from app.schemas import SessionNode

from ..config import log, settings


class RknnSession:
    def __init__(self, model_path: Path | str):
        self.model_path = Path(model_path)

        self.ort_model_path = str(self.model_path).replace(".rknn", ".onnx")

        self.rknn = RKNNLite()

        log.info(f"Loading RKNN model from {self.model_path}")

        self.ort_session = ort.InferenceSession(
            self.ort_model_path,
        )

        # ret = self.rknn.load_onnx(self.model_path)
        print('--> Load RKNN model')
        ret = self.rknn.load_rknn(self.model_path.as_posix())
        if ret != 0:
            raise RuntimeError("Failed to load RKNN model")

        ret = self.rknn.init_runtime()
        if ret != 0:
             raise RuntimeError("Failed to initialize RKNN runtime")

    def get_inputs(self) -> list[SessionNode]:
        inputs: list[SessionNode] = self.ort_session.get_inputs()
        return inputs

    def get_outputs(self) -> list[SessionNode]:
        outputs: list[SessionNode] = self.ort_session.get_outputs()
        return outputs

    def run(
        self,
        output_names: list[str] | None,
        input_feed: dict[str, NDArray[np.float32]] | dict[str, NDArray[np.int32]],
	run_options: Any = None,
    ):

        input_data = [np.ascontiguousarray(v) for v in input_feed.values()][0]


        # log.info(f"Running inference on RKNN model")
        outputs = self.rknn.inference(inputs=[input_data], data_format='nchw')

        # log.info("inputs:")
        # log.info(input_data)
        # log.info("outputs:")
        # log.info(outputs)
        # log.info("RKNN END")
        return outputs

