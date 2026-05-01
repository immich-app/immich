import os
from collections.abc import Callable
from typing import cast

from gunicorn.arbiter import Arbiter
from gunicorn.workers.base import Worker
from prometheus_client import multiprocess

device_ids = os.environ.get("MACHINE_LEARNING_DEVICE_IDS", "0").replace(" ", "").split(",")
env = os.environ


# Round-robin device assignment for each worker
def pre_fork(arbiter: Arbiter, _: Worker) -> None:
    env["MACHINE_LEARNING_DEVICE_ID"] = device_ids[len(arbiter.WORKERS) % len(device_ids)]


def child_exit(_: Arbiter, worker: Worker) -> None:
    mark_process_dead = cast(Callable[[int], None], multiprocess.mark_process_dead)
    mark_process_dead(worker.pid)
