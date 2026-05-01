from __future__ import annotations

import os
import time
from collections.abc import Callable, Iterable
from typing import cast

from prometheus_client import CollectorRegistry, Counter, Gauge, Histogram, generate_latest, multiprocess

from .schemas import InferenceEntries, ModelTask, ModelType

registry = CollectorRegistry()

REQUESTS = Counter(
    "immich_ml_requests_total",
    "Machine-learning prediction requests.",
    ["task", "type", "status"],
    registry=registry,
)

REQUEST_DURATION = Histogram(
    "immich_ml_request_duration_ms",
    "Machine-learning prediction request duration in milliseconds.",
    ["task", "type", "status"],
    buckets=(10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000, float("inf")),
    registry=registry,
)

ACTIVE_REQUESTS = Gauge(
    "immich_ml_active_requests",
    "In-flight machine-learning prediction requests.",
    multiprocess_mode="livesum",
    registry=registry,
)

MODEL_CACHE_ENTRIES = Gauge(
    "immich_ml_model_cache_entries",
    "Machine-learning model cache entries.",
    ["task", "type"],
    multiprocess_mode="livesum",
    registry=registry,
)

MODEL_LOAD_DURATION = Histogram(
    "immich_ml_model_load_duration_ms",
    "Machine-learning model load duration in milliseconds.",
    ["task", "type", "status"],
    buckets=(10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000, float("inf")),
    registry=registry,
)

_MODEL_CACHE_LABELS: set[tuple[str, str]] = set()


def labels_from_entries(entries: InferenceEntries) -> list[tuple[str, str]]:
    without_deps, with_deps = entries
    labels: list[tuple[str, str]] = []
    for entry in [*without_deps, *with_deps]:
        task = entry["task"].value if isinstance(entry["task"], ModelTask) else str(entry["task"])
        model_type = entry["type"].value if isinstance(entry["type"], ModelType) else str(entry["type"])
        labels.append((task, model_type))
    return labels or [("unknown", "unknown")]


def record_predict(labels: Iterable[tuple[str, str]], status: str, started: float) -> None:
    duration_ms = (time.perf_counter() - started) * 1000
    for task, model_type in labels:
        REQUESTS.labels(task=task, type=model_type, status=status).inc()
        REQUEST_DURATION.labels(task=task, type=model_type, status=status).observe(duration_ms)


def record_validation_error(started: float) -> None:
    record_predict([("unknown", "unknown")], "validation_error", started)


def record_model_load(task: str, model_type: str, status: str, started: float) -> None:
    duration_ms = (time.perf_counter() - started) * 1000
    MODEL_LOAD_DURATION.labels(task=task, type=model_type, status=status).observe(duration_ms)


def set_model_cache_entries(labels: Iterable[tuple[str, str]]) -> None:
    counts: dict[tuple[str, str], int] = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1

    current_labels = set(counts)
    for task, model_type in _MODEL_CACHE_LABELS - current_labels:
        MODEL_CACHE_ENTRIES.labels(task=task, type=model_type).set(0)

    for (task, model_type), count in counts.items():
        MODEL_CACHE_ENTRIES.labels(task=task, type=model_type).set(count)

    _MODEL_CACHE_LABELS.clear()
    _MODEL_CACHE_LABELS.update(current_labels)


def is_multiprocess_enabled() -> bool:
    return bool(os.environ.get("PROMETHEUS_MULTIPROC_DIR"))


def render() -> bytes:
    if is_multiprocess_enabled():
        multiprocess_registry = CollectorRegistry()
        multi_process_collector = cast(Callable[[CollectorRegistry], object], multiprocess.MultiProcessCollector)
        multi_process_collector(multiprocess_registry)
        return generate_latest(multiprocess_registry)

    return generate_latest(registry)


def reset_metrics_for_tests() -> None:
    REQUESTS.clear()
    REQUEST_DURATION.clear()
    ACTIVE_REQUESTS.set(0)
    MODEL_CACHE_ENTRIES.clear()
    _MODEL_CACHE_LABELS.clear()
    MODEL_LOAD_DURATION.clear()
