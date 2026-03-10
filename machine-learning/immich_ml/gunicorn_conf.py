import os

from gunicorn.arbiter import Arbiter
from gunicorn.workers.base import Worker

from immich_ml.config import settings

max_requests = settings.worker_max_requests
max_requests_jitter = settings.worker_max_requests_jitter

device_ids = os.environ.get("MACHINE_LEARNING_DEVICE_IDS", "0").replace(" ", "").split(",")
env = os.environ


# Round-robin device assignment for each worker
def pre_fork(arbiter: Arbiter, _: Worker) -> None:
    env["MACHINE_LEARNING_DEVICE_ID"] = device_ids[len(arbiter.WORKERS) % len(device_ids)]
