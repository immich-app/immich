import os
import sys
from ipaddress import ip_address

import requests

port = os.getenv("IMMICH_PORT", 3003)
host = os.getenv("IMMICH_HOST", "0.0.0.0")

host = "localhost" if host == "0.0.0.0" else host
host = f"[{host}]" if ip_address(host).version == 6 else host

try:
    response = requests.get(f"http://{host}:{port}/ping", timeout=2)
    if response.status_code == 200:
        sys.exit(0)
    sys.exit(1)
except requests.RequestException:
    sys.exit(1)
