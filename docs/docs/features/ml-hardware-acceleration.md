# Hardware-Accelerated Machine Learning [Experimental]

This feature allows you to use a GPU to accelerate machine learning tasks, such as Smart Search and Facial Recognition, while reducing CPU load.
As this is a new feature, it is still experimental and may not work on all systems.

## Supported APIs

- ARM NN (Mali)
- CUDA (NVIDIA)
- OpenVINO (Intel)

## Limitations

- The instructions and configurations here are specific to Docker Compose. Other container engines may require different configuration.
- Only Linux and Windows (through WSL2) servers are supported.
- ARM NN is only supported on devices with Mali GPUs. Other Arm devices are not supported.
- The OpenVINO backend has only been tested on an iGPU. ARC GPUs may not work without other changes.

## Prerequisites

#### ARM NN

- Make sure you have the appropriate linux kernel driver installed
  - This is usually pre-installed on the device vendor's Linux images
- `/dev/mali0` must be available in the host server
  - You may confirm this by running `ls /dev` to check that it exists
- You must have the closed-source `libmali.so` firmware (possibly with an additional firmware file)
  - Where and how you can get this file depends on device and vendor, but typically, the device vendor also supplies these
  - The `hwaccel.ml.yml` file assumes the path to it is `/usr/lib/libmali.so`, so update accordingly if it is elsewhere
  - The `hwaccel.ml.yml` file assumes an additional file `/lib/firmware/mali_csffw.bin`, so update accordingly if your device's driver does not require this file

#### CUDA

- You must have the official NVIDIA driver installed on the server.
- On Linux (except for WSL2), you also need to have [NVIDIA Container Runtime][nvcr] installed.

## Setup

1. If you do not already have it, download the latest [`hwaccel.ml.yml`][hw-file] file and ensure it's in the same folder as the `docker-compose.yml`.
2. In the `docker-compose.yml` under `immich-machine-learning`, uncomment the `extends` section and change `cpu` to the appropriate backend.
3. Redeploy the `immich-machine-learning` container with these updated settings.

[hw-file]: https://github.com/immich-app/immich/releases/latest/download/hwaccel.ml.yml
[nvcr]: https://github.com/NVIDIA/nvidia-container-runtime/

## Tips

- You may want to increase concurrency past the default for higher utilization. However, keep in mind that this will also increase VRAM consumption.
- Larger models benefit more from hardware acceleration, if you have the VRAM for them.
