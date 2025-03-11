# This code is from leafqycc/rknn-multi-threaded
# Following Apache License 2.0

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from queue import Queue

import numpy as np
from numpy.typing import NDArray

from app.config import log

supported_socs = ["rk3566", "rk3588"]
coremask_supported_socs = ["rk3576", "rk3588"]


def get_soc(device_tree_path: Path | str) -> str | None:
    try:
        with Path(device_tree_path).open() as f:
            device_compatible_str = f.read()
            for soc in supported_socs:
                if soc in device_compatible_str:
                    return soc
            log.warning("Device is not supported for RKNN")
    except OSError as e:
        log.warning("Could not read /proc/device-tree/compatible. Reason: %s", e.msg)
    return None


soc_name = None
is_available = False
try:
    from rknnlite.api import RKNNLite

    soc_name = get_soc("/proc/device-tree/compatible")
    is_available = soc_name is not None
except ImportError:
    log.debug("RKNN is not available")


def init_rknn(model_path: str) -> RKNNLite:
    if not is_available:
        raise RuntimeError("rknn is not available!")
    rknn_lite = RKNNLite()
    ret = rknn_lite.load_rknn(model_path)
    if ret != 0:
        raise RuntimeError("Load RKNN rknnModel failed")

    if soc_name in coremask_supported_socs:
        ret = rknn_lite.init_runtime(core_mask=RKNNLite.NPU_CORE_AUTO)
    else:
        ret = rknn_lite.init_runtime()  # Please do not set this parameter on other platforms.

    if ret != 0:
        raise RuntimeError("Init runtime environment failed")

    return rknn_lite


class RknnPoolExecutor:
    def __init__(self, model_path: str, tpes: int, func):
        self.tpes = tpes
        self.queue = Queue()
        self.rknn_pool = [init_rknn(model_path) for _ in range(tpes)]
        self.pool = ThreadPoolExecutor(max_workers=tpes)
        self.func = func
        self.num = 0

    def put(self, inputs) -> None:
        self.queue.put(self.pool.submit(self.func, self.rknn_pool[self.num % self.tpes], inputs))
        self.num += 1

    def get(self) -> list[list[NDArray[np.float32]], bool]:
        if self.queue.empty():
            return None
        fut = self.queue.get()
        return fut.result()

    def release(self) -> None:
        self.pool.shutdown()
        for rknn_lite in self.rknn_pool:
            rknn_lite.release()

    def __del__(self) -> None:
        self.release()
