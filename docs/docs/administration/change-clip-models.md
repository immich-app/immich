# Change CLIP models

This guide switches the model that powers contextual (smart) search. To decide _which_ model to switch to, see the [CLIP models reference](/reference/clip-models), which compares every supported model by memory use, speed, and recall per language.

The model is set at `Administration > Settings > Machine Learning Settings > Smart Search`.

## Steps

Once you've chosen a model, follow these steps:

1. Copy the name of the model (e.g. `ViT-B-16-SigLIP__webli`)
2. Go to the [Smart Search settings][smart-search-settings]
3. Paste the model name into the Model Name section
4. Save the settings
5. Go to the [Job Status page][job-status-page]
6. Click "All" next to "Smart Search" to begin re-processing your assets with the new model
7. (Optional) Confirm that the logs for the server and machine learning service don't have relevant errors

In rare instances, changing the model might leave bits of the old model's incompatible data in the database, causing errors when processing Smart Search jobs. If you notice errors like this in the logs, you can change the model back to the previous one and save, then repeat steps 3-7.

[smart-search-settings]: https://my.immich.app/admin/system-settings?isOpen=machine-learning+smart-search
[job-status-page]: https://my.immich.app/admin/queues
