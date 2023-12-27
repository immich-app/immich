---
sidebar_position: 6
---
# Machine Learning

### How does smart search work?

Immich uses CLIP models, for more information about CLIP and its capabilities can be [read here](https://openai.com/research/clip).

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

### What is the best order for ML to best work

Because Immich is relies on thumbnail generation
For machine learning [[1](/docs/developer/architecture#:~:text=For%20example%2C%20Smart%20Search%20and%20Facial%20Recognition%20relies%20on%20thumbnail%20generation)], it is recommended to wait for the thumbnail generation job to finish and then run the machine learning jobs (Smart Search and Facial Recognition)

* Let all jobs run except the machine learning jobs and wait for them to finish
* Run Smart Search
* Run Facial Recognition

### Can I use a custom CLIP model?

No, this is not supported. Only models listed in the [Huggingface](https://huggingface.co/immich-app) are compatible. Feel free to make a feature request if there's a model not listed here that you think should be added.

### I want to be able to search in other languages besides English. How can I do that?

You can change to a multilingual model listed [here](https://huggingface.co/collections/immich-app/multilingual-clip-654eb08c2382f591eeb8c2a7) by going to Administration > Machine Learning Settings > Smart Search and replacing the name of the model. Be sure to re-run Smart Search on all assets after this change. You can then search in over 100 languages.

:::note
feel free to make a feature request if there's a model you want to use that isn't in Immich Huggingface list.
:::

### Does Immich support Facial Recognition for videos ?

This is not currently implemented, but may be in the future.

On the other hand, Immich uses a thumbnail image created from the video in order to scan it for a face, if there is a face in the thumbnail image of the video, Immich will try to recognize a face in thumbnail.

### Does Immich have animal recognition?
No.