---
sidebar_position: 1
---

# Requirements

Hardware and software requirements to run Immich.

## Software

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

:::info Podman
You can also use Podman to run the application. However, additional configuration might be required.
:::

## Hardware

- **OS**: Preferred unix-based operating system (Ubuntu, Debian, MacOS, etc). Windows works too, with [Docker Desktop on Windows](https://docs.docker.com/desktop/install/windows-install/)
- **RAM**: At least 2GB, preferred 4GB.
- **CPU**: At least 2 cores, preferred 4 cores.

:::info Machine Learning on older CPU

TensorFlow doesn't run with older CPU architecture, it requires a CPU with AVX and AVX2 instruction set. If you encounter the error `illegal instruction core dump` check for your CPU flags with the command and make sure you see `AVX` and `AVX2`:

```bash
more /proc/cpuinfo | grep flags
```

#### Promox

If you are running virtualization in Proxmox, the VM doesn't have the flag enabled.

You need to change the CPU type from `kvm64` to `host` under VMs hardware tab.

`Hardware > Processors > Edit > Advanced > Type (dropdown menu) > host`

#### Other platforms

You can use the machine learning image that is built for Non-AVX CPU. The image is community maintained and can be found in the repository below

https://github.com/bertmelis/immich-machine-learning-no-avx
:::
