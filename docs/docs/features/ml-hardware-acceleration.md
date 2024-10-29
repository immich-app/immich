# Hardware-Accelerated Machine Learning [Experimental]

This feature allows you to use a GPU to accelerate machine learning tasks, such as Smart Search and Facial Recognition, while reducing CPU load.
As this is a new feature, it is still experimental and may not work on all systems.

:::info
You do not need to redo any machine learning jobs after enabling hardware acceleration. The acceleration device will be used for any jobs that run after enabling it.
:::

## Supported Backends

- ARM NN (Mali)
- CUDA (NVIDIA GPUs with [compute capability](https://developer.nvidia.com/cuda-gpus) 5.2 or higher)
- OpenVINO (Intel discrete GPUs such as Iris Xe and Arc)

## Limitations

- The instructions and configurations here are specific to Docker Compose. Other container engines may require different configuration.
- Only Linux and Windows (through WSL2) servers are supported.
- ARM NN is only supported on devices with Mali GPUs. Other Arm devices are not supported.
- Some models may not be compatible with certain backends. CUDA is the most reliable.

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
- Optional: Configure your `.env` file, see [environment variables](/docs/install/environment-variables) for ARM NN specific settings

#### CUDA

- The GPU must have compute capability 5.2 or greater.
- The server must have the official NVIDIA driver installed.
- The installed driver must be >= 535 (it must support CUDA 12.2).
- On Linux (except for WSL2), you also need to have [NVIDIA Container Toolkit][nvct] installed.

#### OpenVINO

- The server must have a discrete GPU, i.e. Iris Xe or Arc. Expect issues when attempting to use integrated graphics.
- Ensure the server's kernel version is new enough to use the device for hardware accceleration.

## Setup

1. If you do not already have it, download the latest [`hwaccel.ml.yml`][hw-file] file and ensure it's in the same folder as the `docker-compose.yml`.
2. In the `docker-compose.yml` under `immich-machine-learning`, uncomment the `extends` section and change `cpu` to the appropriate backend.
3. Still in `immich-machine-learning`, add one of -[armnn, cuda, openvino] to the `image` section's tag at the end of the line.
4. Redeploy the `immich-machine-learning` container with these updated settings.

### Confirming Device Usage

You can confirm the device is being recognized and used by checking its utilization. There are many tools to display this, such as `nvtop` for NVIDIA or Intel and `intel_gpu_top` for Intel.

You can also check the logs of the `immich-machine-learning` container. When a Smart Search or Face Detection job begins, or when you search with text in Immich, you should either see a log for `Available ORT providers` containing the relevant provider (e.g. `CUDAExecutionProvider` in the case of CUDA), or a `Loaded ANN model` log entry without errors in the case of ARM NN.

#### Single Compose File

Some platforms, including Unraid and Portainer, do not support multiple Compose files as of writing. As an alternative, you can "inline" the relevant contents of the [`hwaccel.ml.yml`][hw-file] file into the `immich-machine-learning` service directly.

For example, the `cuda` section in this file is:

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities:
            - gpu
```

You can add this to the `immich-machine-learning` service instead of extending from `hwaccel.ml.yml`:

```yaml
immich-machine-learning:
  container_name: immich_machine_learning
  # Note the `-cuda` at the end
  image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION:-release}-cuda
  # Note the lack of an `extends` section
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities:
              - gpu
  volumes:
    - model-cache:/cache
  env_file:
    - .env
  restart: always
```

Once this is done, you can redeploy the `immich-machine-learning` container.

#### Multi-GPU

If you want to utilize multiple NVIDIA or Intel GPUs, you can set the `MACHINE_LEARNING_DEVICE_IDS` environmental variable to a comma-separated list of device IDs and set `MACHINE_LEARNING_WORKERS` to the number of listed devices. You can run a command such as `nvidia-smi -L` or `glxinfo -B` to see the currently available devices and their corresponding IDs.

For example, if you have devices 0 and 1, set the values as follows:

```
MACHINE_LEARNING_DEVICE_IDS=0,1
MACHINE_LEARNING_WORKERS=2
```

In this example, the machine learning service will spawn two workers, one of which will allocate models to device 0 and the other to device 1. Different requests will be processed by one worker or the other.

This approach can be used to simply specify a particular device as well. For example, setting `MACHINE_LEARNING_DEVICE_IDS=1` will ensure device 1 is always used instead of device 0.

Note that you should increase job concurrencies to increase overall utilization and more effectively distribute work across multiple GPUs. Additionally, each GPU must be able to load all models. It is not possible to distribute a single model to multiple GPUs that individually have insufficient VRAM, or to delegate a specific model to one GPU.

[hw-file]: https://github.com/immich-app/immich/releases/latest/download/hwaccel.ml.yml
[nvct]: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html

## Tips

- If you encounter an error when a model is running, try a different model to see if the issue is model-specific.
- You may want to increase concurrency past the default for higher utilization. However, keep in mind that this will also increase VRAM consumption.
- Larger models benefit more from hardware acceleration, if you have the VRAM for them.
