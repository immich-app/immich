---
sidebar_position: 1
---


# Requirements
Hardware and software requirements for Immich

## Software

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

:::info Podman
You can also use Podman to run the application. However, additional configuration might be required on your end.
:::

## Hardware

- **OS**: Preferred unix-based operating system (Ubuntu, Debian, MacOS, etc). Windows works too, with [Docker Desktop on Windows](https://docs.docker.com/desktop/install/windows-install/)
- **RAM**: At least 2GB, preferred 4GB.
- **CPU**: At least 2 cores, preferred 4 cores.

:::info Machine Learning on older CPU

The TensorFlow version used by Immich doesn't run on older CPU architectures. It requires a CPU with AVX and AVX2 instruction sets. If you encounter the error `illegal instruction core dump` check your CPU flags with the command below and make sure you see `avx` and `avx2`:

```bash
grep -E 'avx2?' /proc/cpuinfo
```

#### Promox

If you are running virtualization in Proxmox, the CPU type of the VM is probably configured incorrectly.

You need to change the CPU type from `kvm64` to `host` under VMs hardware tab.

`Hardware > Processors > Edit > Advanced > Type (dropdown menu) > host`

#### Other platforms

You can use the machine learning image that is built for Non-AVX CPU. The image is community maintained and can be found in the repository below

https://github.com/bertmelis/immich-machine-learning-no-avx

Otherwise, you can safely remove the `immich-machine-learning` service if you do not intend to use Immich's object detection features. Simply remove or comment out the declaration of the service in your compose file.
:::

## Installation methods

There are a couple installation methods that you can use to install the application. You can choose the one that suits you the best.

1. [One-step installation (Evaluation only)](/docs/installation/one-step-installation)
2. **[Docker Compose with manual configuration (Recommended)](/docs/installation/recommended-installation)**
3. [Portainer](/docs/installation/portainer-installation)
4. [Unraid (Community contribution)](/docs/installation/unraid-installation)
