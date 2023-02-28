"""
Gunicorn configuration options.
https://docs.gunicorn.org/en/stable/settings.html#config-file
"""
import os


# Set the bind address based on the env
server_port = os.getenv('MACHINE_LEARNING_PORT') or "3003"
bind = f"127.0.0.1:{server_port}"

# Preload the Flask app / models etc. before starting the server
preload_app = True
