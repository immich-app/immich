---
sidebar_position: 7
---

# Performance

### Why is Immich slow on low-memory systems like the Raspberry Pi?

Immich optionally uses machine learning for several features. However, it can be too heavy to run on a Raspberry Pi. You can [mitigate](/docs/FAQ/Performance-FAQ#how-can-i-lower-immichs-cpu-usage) this or [disable](/docs/FAQ/Machine-Learning-FAQ#how-can-i-disable-machine-learning) machine learning entirely.

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

### Can I boost machine learning speed?
Yes, you can do it by increasing the amount of job concurrency, as the amount increases, the computer will work on several assets at the same time.
You can do it by
1. Admin user login
2. Administration
3. jobs
4. On the left side Manage Concurrency
5. Change the settings as needed

:::danger
On a normal machine, 2 or 3 concurrent jobs can probably max the CPU, so if you're not hitting those maximums with, say, 30 jobs,
Also, it is important to know that the Storage should have INPUT & OUTPUT at high speed in order to handle all of this

For reference I never went above 32/job while testing with an RTX 4090 GPU
Or for example if machine learning is enabled by a CPU such as I7 8700 a bit higher than default here would be like 16/job.

Do not exaggerate with the amount of jobs because you're probably thoroughly overloading the database.

more info [here](https://discord.com/channels/979116623879368755/994044917355663450/1174711719994605708)
:::


### When you run machine learning my processor is 100% usge is it noraml?
When a large amount of assets are uploaded to Immich it makes sense that the CPU and RAM will be heavily used due to machine learning work and creating image thumbnails after that, the percentage of CPU usage will drop to around 3-5% usage
