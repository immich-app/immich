---
sidebar_position: 75
---

# Ansible - MASH Playbook [Community]

:::note
This is a community contribution and not officially supported by the Immich team, but included here for convenience.

**Please report issues to the [MASH playbook][mash-playbook] or [Ansible role for Immich][ansible-role-immich] GitHub repositories.**
:::

[MASH][mash-playbook] (**M**other-of-**A**ll-**S**elf-**H**osting) is an [Ansible](https://www.ansible.com/) playbook that helps you self-host [Immich](https://immich.app/) and [many other FOSS services](https://github.com/mother-of-all-self-hosting/mash-playbook/blob/main/docs/supported-services.md) as [Docker](https://www.docker.com/) containers on your own server.

MASH is free software, available under the [AGPLv3 license][mash-playbook]. The [Ansible role for Immich][ansible-role-immich] which powers it is also free software, available under the [GPLv3 license][ansible-role-immich].

## Why Use an Ansible Playbook?

Using Docker containers directly (via [Docker Compose](/install/docker-compose.mdx)) is a good way to run Immich, but the Ansible playbook approach offers some additional benefits:

- **Automation**: Ansible automates the entire setup process, making it easy to deploy Immich consistently across multiple servers or to rebuild your setup from scratch.

- **Security Hardening**: The [Ansible role for Immich][ansible-role-immich]t runs containers with security best practices, including:
  - Dropping all Linux capabilities (`--cap-drop=ALL`) and only adding back the minimal required ones
  - Running containers as non-root users (`--user`)
  - Read-only root filesystems (`--read-only`)

- **Reproducibility**: Your entire server configuration is defined in code (Ansible inventory files), making it easy to version control, review, and replicate.

- **Integrated Ecosystem**: MASH supports [many other services](https://github.com/mother-of-all-self-hosting/mash-playbook/blob/main/docs/supported-services.md) (reverse proxy via [Traefik](https://traefik.io/), databases, backup solutions, etc.) that can be deployed alongside Immich with minimal additional configuration.

## Features

The Ansible role uses official Immich container images and manages the following components:

- **Immich Server**: The main application server handling HTTP requests, media processing, and transcoding
- **Immich Machine Learning**: The ML service for image classification and facial recognition (can be disabled or hosted separately)
- **PostgreSQL**: A dedicated [Immich-specific Postgres](https://github.com/immich-app/base-images/tree/main/postgres) instance with the required extensions (pgvector, etc.)
- **Valkey/Redis**: A dedicated data store for Immich

It also supports configuring:

- [Hardware acceleration for video transcoding](/features/hardware-transcoding.md) (VAAPI, QuickSync, NVENC, RKMPP)
- [Hardware acceleration for machine learning](/features/ml-hardware-acceleration.md) (OpenVINO, CUDA, ARM NN, ROCm, RKNN)
- Automatic Traefik reverse proxy integration

## Installation

To get started:

1. First, follow the [MASH playbook setup guide](https://github.com/mother-of-all-self-hosting/mash-playbook/blob/main/docs/README.md) to prepare your server and configure the playbook
2. Then, add Immich to your setup by following the [MASH Immich service documentation](https://github.com/mother-of-all-self-hosting/mash-playbook/blob/main/docs/services/immich.md)

## Related Projects

- [Immich Kiosk](https://github.com/mother-of-all-self-hosting/mash-playbook/blob/main/docs/services/immich-kiosk.md) - A slideshow application for displaying Immich photos on browsers and devices, also available via MASH

## Support

Community support is available via:

- Matrix room: [#mash-playbook:devture.com](https://matrix.to/#/#mash-playbook:devture.com)
- GitHub issues: [mother-of-all-self-hosting/mash-playbook/issues](https://github.com/mother-of-all-self-hosting/mash-playbook/issues)

[mash-playbook]: https://github.com/mother-of-all-self-hosting/mash-playbook
[ansible-role-immich]: https://github.com/mother-of-all-self-hosting/ansible-role-immich
