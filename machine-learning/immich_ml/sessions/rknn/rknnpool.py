# This code is from leafqycc/rknn-multi-threaded
# Following Apache License 2.0

import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Callable

import numpy as np
from numpy.typing import NDArray

from immich_ml.config import log
from immich_ml.models.constants import RKNN_COREMASK_SUPPORTED_SOCS, RKNN_SUPPORTED_SOCS


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
        func: Callable[["RKNNLite", list[NDArray[np.float32]]], list[NDArray[np.float32]]],
    ) -> None:
        self.tpes = tpes
        self.rknn_pool = [init_rknn(model_path) for _ in range(tpes)]
        self.pool = ThreadPoolExecutor(max_workers=tpes)
        self.func = func
        self.num = 0
        self.lock = threading.Lock()

    def run(self, inputs: list[NDArray[np.float32]]) -> list[NDArray[np.float32]]:
        with self.lock:
            idx = self.num % self.tpes
            self.num += 1

        fut = self.pool.submit(self.func, self.rknn_pool[idx], inputs)
        return fut.result()

    def release(self) -> None:
        self.pool.shutdown()
        for rknn_lite in self.rknn_pool:
            rknn_lite.release()

    def __del__(self) -> None:
        self.release()
