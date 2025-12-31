from __future__ import annotations

from importlib import import_module

__all__ = ["rknn_pool"]

rknn_pool = import_module(f"{__name__}.rknn_pool")
