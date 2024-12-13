# Remote Machine Learning

To alleviate [performance issues on low-memory systems](/docs/FAQ.mdx#why-is-immich-slow-on-low-memory-systems-like-the-raspberry-pi) like the Raspberry Pi, you may also host Immich's machine learning container on a more powerful system, such as your laptop or desktop computer. The server container will send requests containing the image preview to the remote machine learning container for processing. The machine learning container does not persist this data or associate it with a particular user.

:::info
Smart Search and Face Detection will use this feature, but Facial Recognition will not. This is because Facial Recognition uses the _outputs_ of these models that have already been saved to the database. As such, its processing is between the server container and the database.
:::

:::danger
Image previews are sent to the remote machine learning container. Use this option carefully when running this on a public computer or a paid processing cloud. Additionally, as an internal service, the machine learning container has no security measures whatsoever. Please be mindful of where it's deployed and who can access it.
:::

1. Ensure the remote server has Docker installed
2. Copy the following `docker-compose.yml` to the remote server

:::info
If using hardware acceleration, the [hwaccel.ml.yml](https://github.com/immich-app/immich/releases/latest/download/hwaccel.ml.yml) file also needs to be added and the `docker-compose.yml` needs to be configured as described in the [hardware acceleration documentation](/docs/features/ml-hardware-acceleration)
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

3. Start the remote machine learning container by running `docker compose up -d`

:::info
Version mismatches between both hosts may cause bugs and instability, so remember to update this container as well when updating the local Immich instance.
:::

4. Navigate to the [Machine Learning Settings](https://my.immich.app/admin/system-settings?isOpen=machine-learning)
5. Click _Add URL_
6. Fill the new field with the URL to the remote machine learning container, e.g. `http://ip:port`

## Forcing remote processing

Adding a new URL to the settings is recommended over replacing the existing URL. This is because it will allow machine learning tasks to be processed successfully when the remote server is down by falling back to the local machine learning container. If you do not want machine learning tasks to be processed locally when the remote server is not available, you can instead replace the existing URL and only provide the remote container's URL. If doing this, you can remove the `immich-machine-learning` section of the local `docker-compose.yml` file to save resources, as this service will never be used.

Do note that this will mean that Smart Search and Face Detection jobs will fail to be processed when the remote instance is not available. This in turn means that tasks dependent on these features—Duplicate Detection and Facial Recognition—will not run for affected assets. If this occurs, you must manually click the _Missing_ button next to Smart Search and Face Detection in the [Job Status](http://my.immich.app/admin/jobs-status) page for the jobs to be retried.

## Load balancing

While several URLs can be provided in the settings, they are tried sequentially; there is no attempt to distribute load across multiple containers. It is recommended to use a dedicated load balancer for such use-cases and specify it as the only URL. Among other things, it may enable the use of different APIs on the same server by running multiple containers with different configurations. For example, one might run an OpenVINO container in addition to a CUDA container, or run a standard release container to maximize both CPU and GPU utilization.

:::tip
The machine learning container can be shared among several Immich instances regardless of the models a particular instance uses. However, using different models will lead to higher peak memory usage.
:::
