---
sidebar_position: 6
---
# Machine Learning

### What is the technology that Immich use for machine learning?

- For search function (smart search) - Immich uses Clip Models, for more information about Clip and its capabilities can be [read here](https://openai.com/research/clip) and [experience here](https://huggingface.co/models?pipeline_tag=zero-shot-image-classification&sort=trending).

- For face detection and recognition, Immich uses [Insightface Model Zoo models](https://github.com/deepinsight/insightface/tree/master/model_zoo).

### How can I disable machine learning?

:::info
Disabling machine learning will result in a poor experience for searching and the 'Explore' page, as these are reliant on it to work as intended.
:::

Machine learning can be disabled under Administration > Settings > Machine Learning Settings, either entirely or by model type. For instance, you can choose to disable smart search with CLIP, but keep facial recognition enabled. This means that the machine learning service will only process the enabled jobs.

However, disabling all jobs will not disable the machine learning service itself. To prevent it from starting up at all in this case, you can comment out the `immich-machine-learning` section of the docker-compose.yml.

### I'm getting errors about models being corrupt or failing to download. What do I do?

You can delete the model cache volume, which is where models are downloaded. This will give the service a clean environment to download the model again.

### What is the technology that Immich works on for machine learning?

* For image classification models listed [here](https://huggingface.co/models?pipeline_tag=image-classification&sort=trending). It must be tagged with the 'Image Classification' task and must support ONNX conversion
* For the search function ~ smart search Immich uses CLIP models. More information about CLIP and its capabilities can be read [here](https://openai.com/research/clip) and tried [here](https://huggingface.co/models?pipeline_tag=zero-shot-image-classification)
* For facial recognition Immich uses each of the InsightFace Model Zoo models. You can look at the model differences in detail [here](https://github.com/deepinsight/insightface/blob/c2db41402c627cab8ea32d55da591940f2258276/model_zoo/README.md#insightface-model-zoo)

### Why did Immich decide to remove object detection?

It was deprecated because it wasn't really used and caused crashes for some users.
users often confuse it with the more useful smart search feature.
For more info see [here](https://github.com/immich-app/immich/pull/5903)

### What is the best order for ML to best work

Because Immich is relies on thumbnail generation
For machine learning [[1](http://localhost:3005/docs/developer/architecture#:~:text=For%20example%2C%20Smart%20Search%20and%20Facial%20Recognition%20relies%20on%20thumbnail%20generation)], it is recommended to wait for the thumbnail generation job to finish and then run the machine learning jobs (Smart Search and Facial Recognition)

* Let all jobs run except the machine learning jobs and wait for them to finish
* Run Smart Search
* Run Facial Recognition

### What are the best ML models I can use for Immich

:::info
It is important to know that these models greatly enhance the Immich ML, but you should know that they require more processing power and more storage and working memory (RAM) If you are using an old computer or Raspberry Pi for Immich you may want to look at [how to use machine learning remotely](/docs/guides/machine-learning) to run the machine learning on a higher performance computer.
:::
:::tip
You can check how much model processing power will be required by checking Flops(B) in [this table](https://github.com/mlfoundations/open_clip/blob/main/docs/openclip_results.csv)
The higher the value this indicates increased consumption of server resources.
:::

* For Facial recognition the best model will be `buffalo_l`.

<details>
  <summary>why is it?</summary>

from this [deepinsight/insightface#1820](https://github.com/deepinsight/insightface/issues/1820) it looks like the "r100 glint360k model" (which seems [antelopev2](https://github.com/deepinsight/insightface/blob/master/python-package/README.md)) performs worse than the `buffalo_l` model because the latter is trained on more data with a better training schedule. Seems like there is a reason that insightface does not promote the `antelopev2` model and prefers the `buffalo_l`[[1](https://github.com/deepinsight/insightface/issues/1820#issuecomment-968200625)].

Glint360k (of `antelopev2`) is 360k identities and 17M images.
WebFace600K(600K identities) is same as WebFace12M(12 million images), a subset of WebFace42M(cleaned WebFace260M)[[2](https://github.com/deepinsight/insightface/issues/1770#issuecomment-927131443)].

See the [full discussion](https://github.com/immich-app/immich/discussions/5028) in GitHub for more information.

</details>

* For the smart search feature the best Clip model will be `ViT-H-14-378-quickgelu` or `vit-H-14-Qickgelu`.

<details>
  <summary>why is it?</summary>

You might want to consider `ViT-H-14-quickgelu` over `ViT-H-14-378-quickgeludfn5b`
because it takes much less processing power and the difference between the
Average perf. on 38 datasets is really "nothing"
to be precise a difference of 0.0118.
And the advantage of ViT-H-14-quickgelu is that it requires much less processing power
381.68 compared to 1054.05.

Sources:
[Discord](https://discord.com/channels/979116623879368755/1174254430221254738),
[openclip results](https://github.com/mlfoundations/open_clip/blob/main/docs/openclip_results.csv#L3),
[openclip retrieval results](https://github.com/mlfoundations/open_clip/blob/main/docs/openclip_retrieval_results.csv).

</details>

<details>
  <summary>How to apply?</summary>

1. In the browser, log in to your Admin user
2. Go to the url [http://localhost:2283/admin/system-settings?open=job-settings](http://localhost:2283/admin/system-settings?open=job-settings)
3. Go to Machine Learning Settings
4. change the models and save
5. rerun the jobs of ML to take effect

</details>

:::note
Changing a model does not delete the previous model, pay attention to delete the old model to save space in drive.
Models are stored in IMMICH_MODEL-CACHE.
:::

### I would like to use the Clip model i created, how can i do that?

you can't, because we have a [whitelist](https://github.com/immich-app/immich/blob/main/machine-learning/app/models/constants.py) of models in the server code that has each model’s [dimension size](https://github.com/immich-app/immich/blob/main/server/src/domain/smart-info/smart-info.constant.ts).  We use this to update the index to the right dim size when the model changes so custom models aren’t supported.
The [export script](https://github.com/immich-app/immich/tree/main/machine-learning/export) in Immich Github page is meant for us to be able to automate exporting and uploading to Huggingface you can send a [pull request](https://github.com/immich-app/immich/pulls) via Github to add this model to Immich check if Immich already have this model in the list of models in [Huggingface](https://huggingface.co/immich-app) before you send pull request.
([Sources](https://discord.com/channels/979116623879368755/1071165397228855327/1187088114599071855))

### I don't speak English, is there a way I can use the Smart Serach in my language?

Yes, you can get such an option, to do this you need to check what is the best model according to your language, you can do it by checking the [table](https://github.com/mlfoundations/open_clip/blob/main/docs/openclip_multilingual_retrieval_results.csv).

:::note
If you found a suitable model for your language and you want to use it you may not be able to because Immich didn't add it to their list of models in [Huggingface](https://huggingface.co/immich-app), you can make it happen by send a [pull request](https://github.com/immich-app/immich/pulls) via Github to add this model to Immich.

It is important to check the level of accuracy of the model and the amount of use of processing power Flops(B) in [this table](https://github.com/mlfoundations/open_clip/blob/main/docs/openclip_results.csv) so you can know it will work well with your system.
:::

### Does Immich support Facial Recognition in video ?

Although it seems that insightface is able to [recognize faces in video](https://github.com/deepinsight/insightface#arcface-video-demo) as of now the option is not yet implemented in Immich.
On the other hand, Immich uses a thumbnail image created from the video in order to scan it for a face, if there is a face in the thumbnail image of the video, Immich will try to recognize a face in thumbnail.