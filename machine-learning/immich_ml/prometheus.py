import os
from pathlib import Path

PROMETHEUS_MULTIPROC_DIR = "PROMETHEUS_MULTIPROC_DIR"
DEFAULT_PROMETHEUS_MULTIPROC_DIR = "/tmp/immich_ml_prometheus"


def prepare_prometheus_multiprocess_dir(path: Path | str | None = None) -> Path:
    multiprocess_dir = Path(
        path or os.environ.get(PROMETHEUS_MULTIPROC_DIR) or DEFAULT_PROMETHEUS_MULTIPROC_DIR
    ).resolve()
    multiprocess_dir.mkdir(parents=True, exist_ok=True)

    for entry in multiprocess_dir.glob("*.db"):
        entry.unlink()

    os.environ[PROMETHEUS_MULTIPROC_DIR] = multiprocess_dir.as_posix()
    return multiprocess_dir
