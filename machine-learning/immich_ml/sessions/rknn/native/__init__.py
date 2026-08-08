from __future__ import annotations

from importlib import import_module
from types import ModuleType

__all__ = ["rknn_pool"]

# Soft-fail when the extension is not built (CPU CI / non-rknn images).
rknn_pool: ModuleType | None
try:
    rknn_pool = import_module(f"{__name__}.rknn_pool")
except ImportError:  # pragma: no cover - depends on local build
    rknn_pool = None
