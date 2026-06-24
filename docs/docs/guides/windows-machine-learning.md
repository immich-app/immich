---
sidebar_position: 90
---

# Machine Learning on Windows (native)

This guide explains how to run the Immich machine learning service **natively on Windows**, so it can use a local NVIDIA GPU without Docker or WSL. It is an alternative to [Remote Machine Learning](/guides/remote-machine-learning): the Immich server still runs wherever it normally does (for example on a NAS) and is simply pointed at the Windows machine for ML inference.

This is useful when your server host has no GPU (or only a slow CPU) but you have a Windows PC with a capable NVIDIA GPU that can take over Smart Search and Face Detection.

:::info
Smart Search and Face Detection use the remote machine learning service, but Facial Recognition does not — it runs between the server and the database. See [Remote Machine Learning](/guides/remote-machine-learning) for details.
:::

:::danger
The machine learning service has no authentication and receives image previews. Only run it on a trusted network and restrict access to the port (default `3003`).
:::

## Prerequisites

- Windows 10/11 with a supported **NVIDIA GPU** and a recent driver.
- **Python 3.11** (matching the version in `machine-learning/.python-version`).
- **Visual Studio Build Tools** with the "Desktop development with C++" workload — `insightface` is built from source on Windows.
- [`uv`](https://docs.astral.sh/uv/) (recommended) or `pip`.

## Setup

1. Get the `machine-learning` source for your Immich version. Either clone the repo and check out the matching tag, or copy the `machine-learning` folder out of the `immich-machine-learning` image:

   ```powershell
   git clone https://github.com/immich-app/immich
   cd immich/machine-learning
   git checkout v1.xxx.x   # match your server version
   ```

2. Create a virtual environment and install the runtime with the CUDA extra:

   ```powershell
   uv sync --no-dev --extra cuda
   ```

   Or with `pip`:

   ```powershell
   py -3.11 -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -e ".[cuda]"
   ```

3. Install the CUDA 12 / cuDNN 9 runtime libraries that `onnxruntime-gpu` needs. On Linux these come from the base image; on Windows install them as wheels:

   ```powershell
   pip install nvidia-cudnn-cu12 nvidia-cublas-cu12 nvidia-cuda-runtime-cu12 nvidia-cufft-cu12 nvidia-curand-cu12 nvidia-cuda-nvrtc-cu12 nvidia-nvjitlink-cu12
   ```

   :::warning cuDNN DLLs must be on `PATH`
   cuDNN 9 loads its sub-libraries (for example `cudnn_engines_tensor_ir64_9.dll`) **by name from `PATH` at runtime**. `onnxruntime.preload_dlls()` is not enough. If the wheel `bin` directories are not on `PATH`, inference fails with `CUDNN_STATUS_SUBLIBRARY_LOADING_FAILED` and silently falls back to the CPU. Add them before launching (see the start script below).
   :::

## Running the service

Create a `start-ml.ps1` script:

```powershell
$ErrorActionPreference = "Stop"
$venv = "$PSScriptRoot\.venv"

# Put the NVIDIA wheel bin directories on PATH so cuDNN can load its sub-libraries.
$nv = "$venv\Lib\site-packages\nvidia"
$bins = "cudnn","cublas","cuda_runtime","cufft","curand","cuda_nvrtc","nvjitlink" |
    ForEach-Object { "$nv\$_\bin" }
$env:PATH = ($bins -join ";") + ";" + $env:PATH

# Optional: keep downloaded models out of the user profile
$env:MACHINE_LEARNING_CACHE_FOLDER = "$PSScriptRoot\cache"

$env:IMMICH_HOST = "0.0.0.0"
$env:IMMICH_PORT = "3003"

& "$venv\Scripts\python.exe" -m immich_ml
```

`python -m immich_ml` detects Windows and starts `uvicorn` directly (gunicorn is Unix-only and is skipped automatically). On first use the required models are downloaded into the cache folder. Verify it is up:

```powershell
curl http://localhost:3003/ping   # -> pong
```

Allow the port through the Windows firewall so the server can reach it:

```powershell
New-NetFirewallRule -DisplayName "immich-ml" -Direction Inbound -Protocol TCP -LocalPort 3003 -Action Allow
```

## Point the server at the Windows machine

In the Immich web UI, go to **Administration → Settings → Machine Learning Settings** and set the URL to `http://<windows-host-ip>:3003`. The server will now send Smart Search and Face Detection requests to the GPU on Windows.

:::info
The Windows process must be running (and the PC awake) for ML jobs to complete. To keep it running across reboots/logoffs, register `start-ml.ps1` as a scheduled task that runs at startup, or wrap it with a service manager such as [NSSM](https://nssm.cc/).
:::
