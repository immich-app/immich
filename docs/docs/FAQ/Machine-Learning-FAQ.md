---
sidebar_position: 6
---

# Machine Learning

### How does smart search work?

Immich uses CLIP models, for more information about CLIP and its capabilities read about it [here](https://openai.com/research/clip).

### How does facial recognition work?

For face detection and recognition, Immich uses [InsightFace models](https://github.com/deepinsight/insightface/tree/master/model_zoo).

### How can I disable machine learning?

:::info
Disabling machine learning will result in a poor experience for searching and the 'Explore' page, as these are reliant on it to work as intended.
:::

Machine learning can be disabled under Administration > Settings > Machine Learning Settings, either entirely or by model type. For instance, you can choose to disable smart search with CLIP, but keep facial recognition enabled. This means that the machine learning service will only process the enabled jobs.

However, disabling all jobs will not disable the machine learning service itself. To prevent it from starting up at all in this case, you can comment out the `immich-machine-learning` section of the docker-compose.yml.

### I'm getting errors about models being corrupt or failing to download. What do I do?

You can delete the model cache volume, which is where models are downloaded to. This will give the service a clean environment to download the model again.

### Why did Immich decide to remove object detection?

The feature added keywords to images for metadata search, but wasn't used for smart search. Smart search made it unnecessary as it isn't limited to exact keywords. Combined with it causing crashes on some devices, using many dependencies and causing user confusion as to how search worked, it was better to remove the job altogether.
For more info see [here](https://github.com/immich-app/immich/pull/5903)

### Can I use a custom CLIP model?

No, this is not supported. Only models listed in the [Huggingface](https://huggingface.co/immich-app) are compatible. Feel free to make a feature request if there's a model not listed here that you think should be added.

### I want to be able to search in other languages besides English. How can I do that?

You can change to a multilingual model listed [here](https://huggingface.co/collections/immich-app/multilingual-clip-654eb08c2382f591eeb8c2a7) by going to Administration > Machine Learning Settings > Smart Search and replacing the name of the model. Be sure to re-run Smart Search on all assets after this change. You can then search in over 100 languages.

:::note
Feel free to make a feature request if there's a model you want to use that isn't in [Immich Huggingface list](https://huggingface.co/immich-app).
:::

### Does Immich support Facial Recognition for videos ?

This is not currently implemented, but may be in the future.

On the other hand, Immich does scan video thumbnails for faces, so it can perform recognition if the face is clear in the video thumbnail.

### Does Immich have animal recognition?

No.

### The immich_model-cache volume takes up a lot of space, what could be the problem?

If you installed several models and chose not to use some of them, it might be worth deleting the old models that are in immich_model-cache.

To do this you can run:

- `docker run -it --rm -v immich_model-cache:/mnt ubuntu bash`
- `cd mnt`
- `ls`
- and delete unused models with `rm -r <model_name>`.
