"""
Gunicorn configuration options.
https://docs.gunicorn.org/en/stable/settings.html
"""
import os


# Set the bind address based on the env
port = os.getenv("MACHINE_LEARNING_PORT") or "3003"
listen_ip = os.getenv("MACHINE_LEARNING_IP") or "0.0.0.0"
bind = [f"{listen_ip}:{port}"]

# Preload the Flask app / models etc. before starting the server
preload_app = True

# Logging settings - log to stdout and set log level
accesslog = "-"
loglevel = os.getenv("MACHINE_LEARNING_LOG_LEVEL") or "info"

# Worker settings
# ----------------------
# It is important these are chosen carefully as per
# https://pythonspeed.com/articles/gunicorn-in-docker/
# Otherwise we get workers failing to respond to heartbeat checks,
# especially as requests take a long time to complete.
workers = 2
threads = 4
worker_tmp_dir = "/dev/shm"
timeout = 60
