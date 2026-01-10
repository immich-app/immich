import os
import sys

from gunicorn.arbiter import Arbiter
from gunicorn.workers.base import Worker

device_ids = os.environ.get("MACHINE_LEARNING_DEVICE_IDS", "0").replace(" ", "").split(",")
env = os.environ

# On macOS, CoreML and other Objective-C frameworks are not fork-safe.
# When gunicorn forks workers, the Objective-C runtime may crash with:
# "NSPlaceholderString initialize may have been in progress in another thread when fork() was called"
# This environment variable disables the fork safety check to allow CoreML to work.
# See: https://github.com/immich-app/immich/issues/24493
if sys.platform == "darwin":
    env.setdefault("OBJC_DISABLE_INITIALIZE_FORK_SAFETY", "YES")


# Round-robin device assignment for each worker
def pre_fork(arbiter: Arbiter, _: Worker) -> None:
    env["MACHINE_LEARNING_DEVICE_ID"] = device_ids[len(arbiter.WORKERS) % len(device_ids)]
