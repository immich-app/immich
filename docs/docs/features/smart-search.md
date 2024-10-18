import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Smart Search

Immich uses Postgres as its search database for both metadata and smart search.

Smart search is powered by the [pgvecto.rs](https://github.com/tensorchord/pgvecto.rs) extension, utilizing machine learning models like [CLIP](https://openai.com/research/clip) to provide relevant search results. This allows for freeform searches without requiring specific keywords in the image or video metadata.

## Advanced Search Filters

In addition, Immich offers advanced search functionality, allowing you to find specific content using customizable search filters. These filters include location, one or more faces, specific albums, and more. You can try out the search filters on the [Demo site](https://demo.immich.app).

The filters smart search allows you to search by include:

- People
- Location
  - Country
  - State
  - City
- Camera
  - Make
  - Model
- Date range
- File name or extension
- Media type
  - Image (including live/motion photos)
  - Video
  - All
- Condition
  - Not in any album
  - Archived
  - Favorited

<Tabs>
  <TabItem value="Computer" label="Computer" default>

Some search examples:

<img src={require('./img/advanced-search-filters.webp').default} width="70%" title='Advanced search filters' />

<img src={require('./img/search-ex-1.png').default} width="70%" title='Search Example 1' />

</TabItem>
  <TabItem value="Mobile" label="Mobile">

<img src={require('./img/mobile-smart-search.webp').default} width="30%" title='Smart search on mobile' />

</TabItem>
</Tabs>

## Configuration

Navigating to `Administration > Settings > Machine Learning Settings > Smart Search` will show the options available.

### CLIP model

The default search model is fast, but there are many other options that can provide better search results. The tradeoff of using these models is that they use more memory and are slower (both during Smart Search jobs and when searching). For example, the current best model for English, `ViT-H-14-378-quickgelu__dfn5b`, is roughly 72x slower and uses approximates 4.3GiB of memory compared to 801MiB with the default model `ViT-B-32__openai`.

The first step of choosing the right model for you is to decide which languages your users will search in.

If your users will only search in English, then the recommended [CLIP][huggingface-clip] section is the best place to look. This is a curated list of the models that generally perform the best for their size class. The models here are ordered from higher to lower quality. This means that the top models will generally rank the most relevant results higher and have a higher capacity to understand descriptive, detailed, and/or niche queries. They models are also generally ordered from larger to smaller, so consider the impact on memory usage, job processing and search speed when deciding on one. The smaller models in this list are not too different in quality and many times faster.

[Multilingual models][huggingface-multilingual-clip] are also available so users can search in their native language. Use these models if you expect non-English searches to be common. They can be separated into two search patterns:

- `nllb` models expect the search query to be in the language specified in the user settings
- `xlm` models understand search text regardless of the current language setting

`nllb` models perform the best and are recommended when users primarily searches in their native, non-English language. `xlm` models are more flexible and are recommended for mixed language search, where the same user might search in different languages at different times.

A third option is if your users will search entirely in major Western European languages, such as English, Spanish, French and German. The `ViT-H-14-quickgelu__dfn5b` and `ViT-H-14-378-quickgelu__dfn5b` models perform the best for these languages and are similarly flexible as `xlm` models. However, they understand very few languages compared to the explicitly multilingual `nllb` and `xlm` models, so don't use them for other languages.

:::note
Multilingual models are much slower and larger and perform slightly worse for English than English-only models. For this reason, only use them if you actually intend to search in a language besides English.
:::

Once you've chosen a model, follow these steps:

1. Copy the name of the model (e.g. `ViT-B-16-SigLIP__webli`)
2. Go to the [Smart Search settings][smart-search-settings]
3. Paste the model name into the Model Name section
4. Save the settings
5. Go to the [Job Status page][job-status-page]
6. Click "All" next to "Smart Search" to begin re-processing your assets with the new model
7. (Optional) Confirm that the logs for the server and machine learning service don't have relevant errors

In rare instances, changing the model might leave bits of the old model's incompatible data in the database, causing errors when processing Smart Search jobs. If you notice errors like this in the logs, you can change the model back to the previous one and save, then back again to the new model.

:::note
Feel free to make a feature request if there's a model you want to use that we don't currently support.
:::

[huggingface-clip]: https://huggingface.co/collections/immich-app/clip-654eaefb077425890874cd07
[huggingface-multilingual-clip]: https://huggingface.co/collections/immich-app/multilingual-clip-654eb08c2382f591eeb8c2a7
[smart-search-settings]: https://my.immich.app/admin/system-settings?isOpen=machine-learning+smart-search
[job-status-page]: https://my.immich.app/admin/jobs-status
