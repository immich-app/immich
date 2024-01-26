# Remote Machine Learning

To alleviate [performance issues on low-memory systems](/docs/FAQ.mdx#why-is-immich-slow-on-low-memory-systems-like-the-raspberry-pi) like the Raspberry Pi, you may also host Immich's machine-learning container on a more powerful system (e.g. your laptop or desktop computer):

- Set the URL in Machine Learning Settings on the Admin Settings page to point to the designated ML system, e.g. `http://workstation:3003`.
- Copy the following `docker-compose.yml` to your ML system.
- Start the container by running `docker-compose up -d` or `docker compose up -d` (depending on your Docker version).

:::note Info
Starting with version v1.93.0 face detection work and face recognize were split. From now on face detection is done in the immich_machine_learning service, but facial recognition is done in the immich_microservices service.
:::

```yaml
version: '3.8'

services:
  immich-machine-learning:
    container_name: immich_machine_learning
    image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION:-release}
    volumes:
      - model-cache:/cache
    restart: always
    ports:
      - 3003:3003

volumes:
  model-cache:
```

Please note that version mismatches between both hosts may cause instabilities and bugs, so make sure to always perform updates together.
