import ctypes

_process = ctypes.CDLL(None)


def release() -> None:
    if hasattr(_process, "mi_collect"):
        _process.mi_collect(True)
    elif hasattr(_process, "malloc_trim"):
        _process.malloc_trim(0)
