---
sidebar_position: 7
---

# Performance

### Why is Immich slow on low-memory systems like the Raspberry Pi?

Immich optionally uses machine learning for several features. However, it can be too heavy to run on a Raspberry Pi. You can [mitigate](/docs/FAQ/Performance-FAQ#how-can-i-lower-immichs-cpu-usage) this or transfer to host Immich's machine-learning container on a [more powerful system](/docs/guides/remote-machine-learning) ,or [disable](/docs/FAQ/Machine-Learning-FAQ#how-can-i-disable-machine-learning) machine learning entirely.

### How can I lower Immich's CPU and RAM usage?

The initial backup is the most intensive due to the number of jobs running. The most CPU-intensive ones are transcoding and machine learning jobs (Tag Images, Smart Search, Recognize Faces), and to a lesser extent thumbnail generation. Here are some ways to lower their CPU usage:

- Lower the job concurrency for these jobs to 1.
- Under Settings > Transcoding Settings > Threads, set the number of threads to a low number like 1 or 2.
- Under Settings > Machine Learning Settings > Facial Recognition > Model Name, you can change the facial recognition model to `buffalo_s` instead of `buffalo_l`. The former is a smaller and faster model, albeit not as good.
  - You _must_ re-run the Recognize Faces job for all images after this for facial recognition on new images to work properly.
- If these changes are not enough, see [below](/docs/FAQ/Machine-Learning-FAQ#how-can-i-disable-machine-learning) for how you can disable machine learning.

### How can I change the amount of CPU and RAM that Immich uses?

By default, a container has no resource constraints and can use as much of a given resource as the host's kernel scheduler allows.
You can look at the [original docker docs](https://docs.docker.com/config/containers/resource_constraints/) or use this [guide](https://www.baeldung.com/ops/docker-memory-limit) to learn how to do this.

### How can I boost machine learning speed?

:::note
This advice increases throughput, not latency. This is to say that it will make Smart Search jobs process more quickly, but it won't make searching faster.
:::

You can increase throughput by increasing the job concurrency for machine learning jobs (Smart Search, Recognize Faces). With higher concurrency, the host will work on more assets in parallel. You can do this by navigating to Administration > Settings > Job Settings and increasing concurrency as needed.

:::danger
On a normal machine, 2 or 3 concurrent jobs can probably max the CPU, so if you're not hitting those maximums with, say, 30 jobs.
Note that storage speed and latency may quickly become the limiting factor; particularly when using HDDs.

Do not exaggerate with the amount of jobs because you're probably thoroughly overloading the server.

more info [here](https://discord.com/channels/979116623879368755/994044917355663450/1174711719994605708)
:::

### Why is Immich using so much of my CPU?

When a large amount of assets are uploaded to Immich it makes sense that the CPU and RAM will be heavily used due to machine learning work and creating image thumbnails after that, the percentage of CPU usage will drop to around 3-5% usage
