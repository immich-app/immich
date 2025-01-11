# This code is from leafqycc/rknn-multi-threaded
# Following Apache License 2.0

import os
from concurrent.futures import ThreadPoolExecutor
from queue import Queue

supported_socs = ["rk3562", "rk3566", "rk3568", "rk3576", "rk3588"]
coremask_supported_socs = ["rk3576","rk3588"]

try:
    from rknnlite.api import RKNNLite

    with open("/proc/device-tree/compatible") as f:
        device_compatible_str = f.read()
        for soc in supported_socs:
            if soc in device_compatible_str:
                is_available = True
                soc_name = soc
                break
            else:
                is_available = False
    is_available = os.path.exists("/sys/kernel/debug/rknpu/load")
except (FileNotFoundError, ImportError):
    is_available = False


def initRKNN(rknnModel="./rknnModel/yolov5s.rknn", id=0):
    rknn_lite = RKNNLite()
    ret = rknn_lite.load_rknn(rknnModel)
    if ret != 0:
        print("Load RKNN rknnModel failed")
        exit(ret)
    
    if soc_name in coremask_supported_socs:
        if id == 0:
            ret = rknn_lite.init_runtime(core_mask=RKNNLite.NPU_CORE_0)
        elif id == 1:
            ret = rknn_lite.init_runtime(core_mask=RKNNLite.NPU_CORE_1)
        elif id == 2:
            ret = rknn_lite.init_runtime(core_mask=RKNNLite.NPU_CORE_2)
        elif id == -1:
            ret = rknn_lite.init_runtime(core_mask=RKNNLite.NPU_CORE_0_1_2)
        else:
            ret = rknn_lite.init_runtime()
    else:
        ret = rknn_lite.init_runtime() # Please do not set this parameter on other platforms.

    if ret != 0:
        print("Init runtime environment failed")
        exit(ret)
    print(rknnModel, "\t\tdone")
    return rknn_lite


def initRKNNs(rknnModel="./rknnModel/yolov5s.rknn", TPEs=1):
    rknn_list = []
    for i in range(TPEs):
        rknn_list.append(initRKNN(rknnModel, i % 3))
    return rknn_list


class rknnPoolExecutor:
    def __init__(self, rknnModel, TPEs, func):
        self.TPEs = TPEs
        self.queue = Queue()
        self.rknnPool = initRKNNs(rknnModel, TPEs)
        self.pool = ThreadPoolExecutor(max_workers=TPEs)
        self.func = func
        self.num = 0

    def put(self, frame):
        self.queue.put(self.pool.submit(self.func, self.rknnPool[self.num % self.TPEs], frame))
        self.num += 1

    def get(self):
        if self.queue.empty():
            return None, False
        fut = self.queue.get()
        return fut.result(), True

    def release(self):
        self.pool.shutdown()
        for rknn_lite in self.rknnPool:
            rknn_lite.release()
