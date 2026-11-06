import ctypes
import hashlib
import json
import os
import platform
import re
import subprocess
import sys
import zipfile
from email.parser import Parser
from pathlib import Path

from packaging.tags import parse_tag, sys_tags

from immich_ml.config import settings


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


require(sys.platform == "linux" and platform.machine() == "x86_64", "This recipe requires Linux x86_64")
require(sys.version_info[:2] == (3, 13), "This recipe requires the CUDA image's Python 3.13 ABI")
require(os.environ.get("DEVICE") == "cuda", "The parent must be a locally built CUDA image")
for field, expected in (
    ("tensorrt_rtx", False),
    ("cuda_use_ep_level_unified_stream", True),
    ("cuda_arena_shrinkage", True),
):
    require(getattr(settings, field, None) is expected, f"The parent must implement and enable {field}={expected}")

filename = os.environ.get("ORT_WHEEL", "")
require(bool(re.fullmatch(r"[A-Za-z0-9_.+-]+\.whl", filename)), "ORT_WHEEL must name a wheel in the build context")
wheel = Path("/build-wheel") / filename
expected_sha256 = os.environ.get("ORT_WHEEL_SHA256", "").lower()
require(bool(re.fullmatch(r"[a-f0-9]{64}", expected_sha256)), "Supply ORT_WHEEL_SHA256 from the reviewed build record")
with wheel.open("rb") as stream:
    actual_sha256 = hashlib.file_digest(stream, "sha256").hexdigest()
require(actual_sha256 == expected_sha256, "Wheel SHA256 mismatch")

with zipfile.ZipFile(wheel) as archive:
    metadata_files = [name for name in archive.namelist() if name.endswith(".dist-info/METADATA")]
    wheel_files = [name for name in archive.namelist() if name.endswith(".dist-info/WHEEL")]
    require(len(metadata_files) == len(wheel_files) == 1, "Expected exactly one wheel distribution")
    metadata = Parser().parsestr(archive.read(metadata_files[0]).decode())
    wheel_metadata = Parser().parsestr(archive.read(wheel_files[0]).decode())
require(metadata.get("Name", "").replace("_", "-") == "onnxruntime-gpu", "Expected onnxruntime-gpu")
require(metadata.get("Version") == "1.27.1", "This recipe is pinned to ONNX Runtime 1.27.1")
tags = {tag for value in wheel_metadata.get_all("Tag", []) for tag in parse_tag(value)}
require(bool(tags.intersection(sys_tags())), "Wheel platform, interpreter or ABI tags do not match the parent")

cudart = ctypes.CDLL("libcudart.so.12")
cuda_version = ctypes.c_int()
cudart.cudaRuntimeGetVersion.argtypes = [ctypes.POINTER(ctypes.c_int)]
cudart.cudaRuntimeGetVersion.restype = ctypes.c_int
require(cudart.cudaRuntimeGetVersion(ctypes.byref(cuda_version)) == 0, "Cannot read CUDA runtime version")
require(cuda_version.value == 12020, "This recipe requires CUDA 12.2")
cudnn = ctypes.CDLL("libcudnn.so.9")
cudnn.cudnnGetVersion.restype = ctypes.c_size_t
require(cudnn.cudnnGetVersion() == 91002, "This recipe requires cuDNN 9.10.2")

subprocess.run(
    [
        "uv",
        "--no-cache",
        "pip",
        "install",
        "--python",
        sys.executable,
        "--no-index",
        "--no-deps",
        "--reinstall",
        str(wheel),
    ],
    check=True,
)
subprocess.run(
    [
        sys.executable,
        "-c",
        "import onnxruntime as ort; "
        "from immich_ml.sessions.ort import _providers_default; "
        "assert ort.__version__ == '1.27.1'; "
        "assert _providers_default()[0] == 'CUDAExecutionProvider'",
    ],
    check=True,
)
print(
    json.dumps(
        {
            "wheel_sha256": actual_sha256,
            "onnxruntime": "1.27.1",
            "python": platform.python_version(),
            "cuda_runtime": cuda_version.value,
            "cudnn": 91002,
            "hardware_inference_validated_by_build": False,
        }
    )
)
