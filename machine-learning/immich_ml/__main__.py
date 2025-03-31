import os
import signal
import subprocess
from pathlib import Path

from .config import log, non_prefixed_settings, settings

if source_ref := os.getenv("IMMICH_SOURCE_REF"):
    log.info(f"Initializing Immich ML [{source_ref}]")
else:
    log.info("Initializing Immich ML")

module_dir = Path(__file__).parent

try:
    with subprocess.Popen(
        [
            "python",
            "-m",
            "gunicorn",
            "immich_ml.main:app",
            "-k",
            "immich_ml.config.CustomUvicornWorker",
            "-c",
            module_dir / "gunicorn_conf.py",
            "-b",
            f"{non_prefixed_settings.immich_host}:{non_prefixed_settings.immich_port}",
            "-w",
            str(settings.workers),
            "-t",
            str(settings.worker_timeout),
            "--log-config-json",
            module_dir / "log_conf.json",
            "--keep-alive",
            str(settings.http_keepalive_timeout_s),
            "--graceful-timeout",
            "10",
        ],
    ) as cmd:
        cmd.wait()
except KeyboardInterrupt:
    cmd.send_signal(signal.SIGINT)
exit(cmd.returncode)
