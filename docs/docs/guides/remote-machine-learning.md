# Remote Machine Learning

To alleviate [performance issues on low-memory systems](/docs/FAQ.mdx#why-is-immich-slow-on-low-memory-systems-like-the-raspberry-pi) like the Raspberry Pi, you may also host Immich's machine-learning container on a more powerful system (e.g. your laptop or desktop computer):

- Set the URL in Machine Learning Settings on the Admin Settings page to point to the designated ML system, e.g. `http://workstation:3003`.
- Copy the following `docker-compose.yml` to your ML system.
  - If using [hardware acceleration](/docs/features/ml-hardware-acceleration), the [hwaccel.ml.yml](https://github.com/immich-app/immich/releases/latest/download/hwaccel.ml.yml) file also needs to be added
- Start the container by running `docker compose up -d`.

:::info
Smart Search and Face Detection will use this feature, but Facial Recognition is handled in the server.
:::

:::danger
When using remote machine learning, the thumbnails are sent to the remote machine learning container. Use this option carefully when running this on a public computer or a paid processing cloud.
:::

```yaml
name: immich_remote_ml

services:
  immich-machine-learning:
    container_name: immich_machine_learning
    # For hardware acceleration, add one of -[armnn, cuda, openvino] to the image tag.
    # Example tag: ${IMMICH_VERSION:-release}-cuda
    image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION:-release}
    # extends:
    #   file: hwaccel.ml.yml
    #   service: # set to one of [armnn, cuda, openvino, openvino-wsl] for accelerated inference - use the `-wsl` version for WSL2 where applicable
    volumes:
      - model-cache:/cache
    restart: always
    ports:
      - 3003:3003

volumes:
  model-cache:
```

Please note that version mismatches between both hosts may cause instabilities and bugs, so make sure to always perform updates together.

:::caution
As an internal service, the machine learning container has no security measures whatsoever. Please be mindful of where it's deployed and who can access it.
:::
