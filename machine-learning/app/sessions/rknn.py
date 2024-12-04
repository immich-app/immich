from __future__ import annotations

from pathlib import Path
from typing import Any, List

import numpy as np
from numpy.typing import NDArray
from rknnlite.api import RKNNLite  # Importing RKNN API

from app.models.constants import SUPPORTED_PROVIDERS
from app.schemas import SessionNode

from ..config import log, settings


class RknnSession:
    def __init__(self, model_path: Path | str):
        self.model_path = Path(model_path)
        self.rknn = RKNNLite()  # Initialize RKNN object
#        self.rknn.config(target_platform='rk3566')
        # Load the RKNN model
        log.info(f"Loading RKNN model from {self.model_path}")
        self._load_model()

    def _load_model(self) -> None:
#        ret = self.rknn.load_onnx(self.model_path.as_posix())
        print('--> Load RKNN model')
        ret = self.rknn.load_rknn(self.model_path.as_posix())
        if ret != 0:
            raise RuntimeError("Failed to load RKNN model")
 #       print('--> Building model')
  #      ret = self.rknn.build(do_quantization=False)
        if ret != 0:
            print('Build model failed!')
            exit(ret)

        ret = self.rknn.init_runtime()
        if ret != 0:
            raise RuntimeError("Failed to initialize RKNN runtime")

    def get_inputs(self) -> List[SessionNode]:
        input_attrs = self.rknn.query_inputs()
        return input_attrs  # RKNN does not provide direct SessionNode equivalent

    def get_outputs(self) -> List[SessionNode]:
        output_attrs = self.rknn.query_outputs()
        return output_attrs

    def run(
        self,
        output_names: list[str] | None,
        input_feed: dict[str, NDArray[np.float32]] | dict[str, NDArray[np.int32]],
	    run_options: Any = None,
    ) -> List[NDArray[np.float32]]:
        inputs = [v for v in input_feed.values()]

        # Run inference
        log.debug(f"Running inference on RKNN model")
        outputs = self.rknn.inference(inputs=inputs)
        return outputs

    def release(self) -> None:
        log.info("Releasing RKNN resources")
        self.rknn.release()


# Example Usage:
# session = RknnSession(model_path="path/to/model.rknn")
# outputs = session.run(input_feed={"input_name": input_data})
# session.release()
