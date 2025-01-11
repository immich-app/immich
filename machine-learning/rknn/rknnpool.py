# This code is from leafqycc/rknn-multi-threaded
# Following Apache License 2.0

from queue import Queue
from concurrent.futures import ThreadPoolExecutor, as_completed

supported_socs = ["rk3566","rk3568","rk3588"]

try:
    from rknn.api import RKNNLite
    with open('/proc/device-tree/compatible') as f: 
        # Keep in mind that this is not in container by default.
        # and this way of checking can't check if the rknpu driver is running or not.
        device_compatible_str = f.read()
        for soc in supported_socs:
            if soc in device_compatible_str:
                is_available = True
                break
            else:
                is_available = False
except (FileNotFoundError, ImportError):
    is_available = False


def initRKNN(rknnModel="./rknnModel/yolov5s.rknn", id=0):
    rknn_lite = RKNNLite()
    ret = rknn_lite.load_rknn(rknnModel)
    if ret != 0:
        print("Load RKNN rknnModel failed")
        exit(ret)
    ret = rknn_lite.init_runtime()
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


class rknnPoolExecutor():
    def __init__(self, rknnModel, TPEs, func):
        self.TPEs = TPEs
        self.queue = Queue()
        self.rknnPool = initRKNNs(rknnModel, TPEs)
        self.pool = ThreadPoolExecutor(max_workers=TPEs)
        self.func = func
        self.num = 0

    def put(self, frame):
        self.queue.put(self.pool.submit(
            self.func, self.rknnPool[self.num % self.TPEs], frame))
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