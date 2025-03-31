import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Searching

Immich uses Postgres as its search database for both metadata and contextual CLIP search.

Contextual CLIP search is powered by the [pgvecto.rs](https://github.com/tensorchord/pgvecto.rs) extension, utilizing machine learning models like [CLIP](https://openai.com/research/clip) to provide relevant search results. This allows for freeform searches without requiring specific keywords in the image or video metadata.

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
  - Rating

<Tabs>
  <TabItem value="Computer" label="Computer" default>

Some search examples:

<img src={require('./img/advanced-search-filters.webp').default} width="70%" title='Advanced search filters' />

<img src={require('./img/search-ex-1.webp').default} width="70%" title='Search Example 1' />

</TabItem>
  <TabItem value="Mobile" label="Mobile">

<img src={require('./img/mobile-smart-search.webp').default} width="30%" title='Smart search on mobile' />

</TabItem>
</Tabs>

## Configuration

Navigating to `Administration > Settings > Machine Learning Settings > Smart Search` will show the options available.

### CLIP models

The default search model is fast, but there are many other options that can provide better search results. The tradeoff of using these models is that they're slower and/or use more memory (both when indexing images with background Smart Search jobs and when searching).

The first step of choosing the right model for you is to know which languages your users will search in.

If your users will only search in English, then the [CLIP][huggingface-clip] section is the first place to look. This is a curated list of the models that generally perform the best for their size class. The models here are ordered from higher to lower quality. This means that the top models will generally rank the most relevant results higher and have a higher capacity to understand descriptive, detailed, and/or niche queries. The models are also generally ordered from larger to smaller, so consider the impact on memory usage, job processing and search speed when deciding on one. The smaller models in this list are not too different in quality and many times faster.

[Multilingual models][huggingface-multilingual-clip] are also available so users can search in their native language. Use these models if you expect non-English searches to be common. They can be separated into three search patterns:

- `nllb` models expect the search query to be in the language specified in the user settings
- `xlm` and `siglip2` models understand search text regardless of the current language setting

`nllb` models tend to perform the best and are recommended when users primarily searches in their native, non-English language. `xlm` and `siglip2` models are more flexible and are recommended for mixed language search, where the same user might search in different languages at different times.

For more details, check the tables below to see how they compare in memory usage, speed and quality by language.

Once you've chosen a model, follow these steps:

1. Copy the name of the model (e.g. `ViT-B-16-SigLIP__webli`)
2. Go to the [Smart Search settings][smart-search-settings]
3. Paste the model name into the Model Name section
4. Save the settings
5. Go to the [Job Status page][job-status-page]
6. Click "All" next to "Smart Search" to begin re-processing your assets with the new model
7. (Optional) Confirm that the logs for the server and machine learning service don't have relevant errors

In rare instances, changing the model might leave bits of the old model's incompatible data in the database, causing errors when processing Smart Search jobs. If you notice errors like this in the logs, you can change the model back to the previous one and save, then repeat steps 3-7.

Please note that memory and execution time values are only _estimates_: actual usage will be different depending on many factors. As such, it's mainly intended as a way to compare the relative tradeoffs of each model.

<details>
<summary>Reference</summary>

Memory and execution time estimates were obtained without acceleration on a 7800x3D processor running bare metal Linux. All testing and evaluation was done at f32 precision (the default in Immich).

**Execution Time (ms)**: After warming up the model with one pass, the mean execution time of 100 passes with the same input.

**Memory (MiB)**: The peak RSS usage of the process afer performing the above timing benchmark. Does not include image decoding, concurrent processing, the web server, etc., which are relatively constant factors.

**Recall (%)**: Evaluated on Crossmodal-3600, the average of the recall@1, recall@5 and recall@10 results for zeroshot image retrieval. Chinese (Simplified), English, French, German, Italian, Japanese, Korean, Polish, Russian, Spanish and Turkish are additionally tested on XTD-10. Chinese (Simplified) and English are additionally tested on Flickr30k. The recall metrics are the average across all tested datasets.

**Pareto Optimal**: Whether the model is not completely outclassed by another model. Try to use models that are optimal for the languages relevant to you. Specifically, for a given model and language, if there's another model that's better for that language in at least one respect (memory usage, execution time, recall) while being at least as good for that language in every other way, then the model is not optimal for that language.

</details>

---

<details>
<summary>English</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 85.99      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 85.96      | ❌             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 85.96      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 85.93      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 85.78      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 85.75      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 85.62      | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 85.53      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 85.48      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 85.47      | ✅             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 85.09      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 85.03      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 84.86      | ✅             |
| ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 84.61      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 84.17      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 83.51      | ❌             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 83.28      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 83.24      | ❌             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 83.23      | ❌             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 83.19      | ✅             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 82.54      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 82.43      | ❌             |
| ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 82.36      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 82.28      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 81.9       | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 81.9       | ❌             |
| ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 80.82      | ❌             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 80.65      | ❌             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 80.16      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 79.78      | ❌             |
| ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 78.64      | ❌             |
| ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 78.6       | ❌             |
| ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 78.06      | ❌             |
| ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 78.06      | ❌             |
| ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 77.62      | ✅             |
| ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 77.47      | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 76.91      | ❌             |
| ViT-B-16__laion400m_e32                              | 975          | 4.98                | 76.43      | ✅             |
| ViT-B-16__laion400m_e31                              | 991          | 5.04                | 76.35      | ❌             |
| ViT-B-32__laion400m_e31                              | 999          | 2.28                | 73.83      | ✅             |
| ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 73.62      | ❌             |
| RN50x64__openai                                      | 5079         | 48.79               | 73.34      | ❌             |
| ViT-L-14__openai                                     | 2212         | 19.91               | 72.99      | ❌             |
| ViT-L-14-336__openai                                 | 2616         | 43.45               | 72.76      | ❌             |
| RN50x16__openai                                      | 2221         | 15.87               | 72.59      | ❌             |
| RN50x4__openai                                       | 1416         | 5.85                | 70.8       | ❌             |
| ViT-B-16__openai                                     | 985          | 5.03                | 70.01      | ❌             |
| ViT-B-32__openai                                     | 1004         | 2.26                | 69.9       | ✅             |
| RN101__openai                                        | 1111         | 3.21                | 69.3       | ❌             |
| RN50__openai                                         | 913          | 2.39                | 69.02      | ✅             |
| RN50__cc12m                                          | 914          | 2.37                | 64.59      | ✅             |
| RN101__yfcc15m                                       | 1111         | 3.22                | 55.21      | ❌             |
| RN50__yfcc15m                                        | 908          | 2.34                | 53.63      | ✅             |
</details>
<details>
<summary>Arabic</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 77.3       | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 76.44      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 74.03      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 73.19      | ✅             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 69.31      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 69.29      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 69.29      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 68.64      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 68.35      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 68.25      | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 68.23      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 67.56      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 67.28      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 66.89      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 66.52      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 64.1       | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 61.71      | ✅             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 60.7       | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 59.66      | ✅             |
</details>
<details>
<summary>Bengali</summary>
| Model                            | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|----------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__v1       | 4226         | 75.05               | 76.16      | ✅             |
| nllb-clip-large-siglip__mrl      | 4248         | 75.44               | 75.83      | ❌             |
| nllb-clip-base-siglip__mrl       | 4696         | 16.95               | 73.75      | ✅             |
| nllb-clip-base-siglip__v1        | 4675         | 15.17               | 73.34      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli  | 3029         | 6.87                | 36.43      | ✅             |
| ViT-SO400M-14-SigLIP2__webli     | 3622         | 27.63               | 26.56      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli | 3611         | 27.84               | 26.54      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli | 3854         | 56.57               | 26.19      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli | 3940         | 72.25               | 26.19      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli | 4050         | 107.67              | 25.92      | ❌             |
| ViT-gopt-16-SigLIP2-384__webli   | 6585         | 146.84              | 25.15      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli   | 6475         | 64.51               | 24.18      | ❌             |
| ViT-L-16-SigLIP2-384__webli      | 3057         | 51.7                | 21.44      | ❌             |
| ViT-L-16-SigLIP2-512__webli      | 3358         | 92.59               | 21.11      | ❌             |
| ViT-L-16-SigLIP2-256__webli      | 2830         | 23.77               | 20.94      | ✅             |
</details>
<details>
<summary>Chinese (Simplified)</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 79.7       | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 78.94      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 75.22      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 74.8       | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 73.91      | ❌             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 72.8       | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 72.77      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 72.41      | ✅             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 72.36      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 71.59      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 71.37      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 71.3       | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 71.11      | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 70.95      | ✅             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 70.51      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 67.48      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 66.84      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 65.7       | ✅             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 63.38      | ❌             |
</details>
<details>
<summary>Croatian</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 87.46      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 87.19      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 82.98      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 82.92      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 81.93      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 73.77      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 73.21      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 73.2       | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 72.95      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 72.89      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 72.88      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 72.85      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 72.69      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 70.73      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 70.45      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 70.43      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 69.97      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 54.31      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 53.3       | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 35.64      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 35.17      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 33.65      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 33.55      | ❌             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 20.05      | ✅             |
</details>
<details>
<summary>Cusco Quechua</summary>
| Model                       | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|-----------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl | 4248         | 75.44               | 38.08      | ✅             |
| nllb-clip-large-siglip__v1  | 4226         | 75.05               | 37.87      | ✅             |
| nllb-clip-base-siglip__mrl  | 4696         | 16.95               | 33.41      | ✅             |
| nllb-clip-base-siglip__v1   | 4675         | 15.17               | 33.06      | ✅             |
</details>
<details>
<summary>Czech</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 73.76      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 71.57      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 69.86      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 67.49      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 67.15      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 63.62      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 63.35      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 63.09      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 63.07      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 62.98      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 62.82      | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 62.73      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 62.29      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 62.12      | ✅             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 61.74      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 61.52      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 61.01      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 54.81      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 54.31      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 33.58      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 33.48      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 32.38      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 32.32      | ❌             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 22.89      | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 22.66      | ❌             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 22.6       | ❌             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 22.25      | ❌             |
</details>
<details>
<summary>Danish</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 87.16      | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 86.88      | ❌             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 84.18      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 84.03      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 83.75      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 83.32      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 83.25      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 82.3       | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 82.19      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 81.87      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 81.44      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 81.42      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 80.0       | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 79.82      | ✅             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 79.08      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 75.07      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 74.84      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 67.68      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 67.2       | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 65.59      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 65.36      | ❌             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 42.31      | ✅             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 41.46      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 40.52      | ❌             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 31.31      | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 30.97      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 30.87      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 30.51      | ❌             |
</details>
<details>
<summary>Dutch</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 80.05      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 79.81      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 79.72      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 79.72      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 79.64      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 79.49      | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 79.41      | ❌             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 79.31      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 78.92      | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 78.48      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 78.22      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 78.0       | ✅             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 77.22      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 76.69      | ❌             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 75.94      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 75.6       | ❌             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 75.33      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 75.04      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 72.97      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 72.72      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 72.06      | ✅             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 72.06      | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 70.81      | ✅             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 69.82      | ✅             |
| ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 67.54      | ❌             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 66.77      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 66.6       | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 65.67      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 65.29      | ✅             |
| ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 41.1       | ❌             |
| ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 34.29      | ❌             |
| ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 29.65      | ❌             |
| ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 29.56      | ❌             |
| ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 29.54      | ✅             |
| ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 29.36      | ❌             |
| ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 27.76      | ❌             |
| ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 27.76      | ❌             |
| ViT-B-16__laion400m_e32                              | 975          | 4.98                | 25.67      | ✅             |
| ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 25.59      | ❌             |
| ViT-B-16__laion400m_e31                              | 991          | 5.04                | 25.53      | ❌             |
| ViT-B-32__laion400m_e31                              | 999          | 2.28                | 25.52      | ✅             |
| ViT-L-14__openai                                     | 2212         | 19.91               | 22.31      | ❌             |
| RN50x64__openai                                      | 5079         | 48.79               | 22.27      | ❌             |
| ViT-L-14-336__openai                                 | 2616         | 43.45               | 21.8       | ❌             |
| RN50x16__openai                                      | 2221         | 15.87               | 20.69      | ❌             |
</details>
<details>
<summary>Filipino</summary>
| Model                            | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|----------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl      | 4248         | 75.44               | 67.57      | ✅             |
| nllb-clip-large-siglip__v1       | 4226         | 75.05               | 65.64      | ✅             |
| nllb-clip-base-siglip__mrl       | 4696         | 16.95               | 61.21      | ✅             |
| nllb-clip-base-siglip__v1        | 4675         | 15.17               | 59.42      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli  | 3029         | 6.87                | 36.81      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli   | 6585         | 146.84              | 35.72      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli   | 6475         | 64.51               | 34.75      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli | 3940         | 72.25               | 34.63      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli | 4050         | 107.67              | 34.39      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli | 3854         | 56.57               | 34.27      | ❌             |
| ViT-SO400M-14-SigLIP2__webli     | 3622         | 27.63               | 34.14      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli | 3611         | 27.84               | 33.98      | ❌             |
| ViT-L-16-SigLIP2-384__webli      | 3057         | 51.7                | 30.57      | ❌             |
| ViT-L-16-SigLIP2-512__webli      | 3358         | 92.59               | 30.57      | ❌             |
| ViT-L-16-SigLIP2-256__webli      | 2830         | 23.77               | 30.05      | ✅             |
| ViT-L-16-SigLIP-384__webli       | 3396         | 47.6                | 24.92      | ❌             |
| ViT-L-16-SigLIP-256__webli       | 3160         | 23.84               | 24.02      | ❌             |
| ViT-B-16-SigLIP2__webli          | 3038         | 5.81                | 23.37      | ✅             |
| ViT-B-32-SigLIP2-256__webli      | 3061         | 3.31                | 22.69      | ✅             |
</details>
<details>
<summary>Finnish</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 84.27      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 83.93      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 79.41      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 78.94      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 75.49      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 63.46      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 63.16      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 63.08      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 63.03      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 62.28      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 61.92      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 61.81      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 61.76      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 61.05      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 57.8       | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 57.69      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 57.05      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 40.26      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 40.06      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 31.75      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 31.74      | ❌             |
</details>
<details>
<summary>French</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 86.5       | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 86.5       | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 86.39      | ❌             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 86.15      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 86.1       | ❌             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 86.07      | ❌             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 86.06      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 85.89      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 85.67      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 85.67      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 85.63      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 85.39      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 85.35      | ✅             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 84.97      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 83.8       | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 82.96      | ❌             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 82.91      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 82.52      | ❌             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 81.21      | ✅             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 80.23      | ✅             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 79.85      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 79.47      | ✅             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 79.3       | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 77.49      | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 76.82      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 75.94      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 75.3       | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 75.24      | ❌             |
| ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 69.33      | ❌             |
| ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 64.41      | ❌             |
| ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 62.86      | ❌             |
| ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 59.27      | ❌             |
| ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 59.09      | ❌             |
| ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 58.25      | ❌             |
| ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 58.25      | ❌             |
| ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 56.97      | ✅             |
| ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 56.21      | ✅             |
| ViT-B-32__laion400m_e31                              | 999          | 2.28                | 53.36      | ✅             |
| ViT-B-16__laion400m_e32                              | 975          | 4.98                | 53.33      | ✅             |
| ViT-B-16__laion400m_e31                              | 991          | 5.04                | 53.26      | ❌             |
| ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 53.22      | ❌             |
| ViT-L-14__openai                                     | 2212         | 19.91               | 46.34      | ❌             |
| RN50x64__openai                                      | 5079         | 48.79               | 46.3       | ❌             |
| ViT-L-14-336__openai                                 | 2616         | 43.45               | 45.95      | ❌             |
| RN50x16__openai                                      | 2221         | 15.87               | 45.69      | ❌             |
| RN50x4__openai                                       | 1416         | 5.85                | 42.48      | ❌             |
| RN101__openai                                        | 1111         | 3.21                | 40.16      | ❌             |
| ViT-B-16__openai                                     | 985          | 5.03                | 40.1       | ❌             |
| ViT-B-32__openai                                     | 1004         | 2.26                | 38.27      | ✅             |
| RN50__openai                                         | 913          | 2.39                | 37.8       | ✅             |
</details>
<details>
<summary>German</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 87.32      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 87.29      | ❌             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 87.29      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 87.21      | ✅             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 87.18      | ❌             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 87.14      | ❌             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 87.07      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 86.83      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 86.81      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 86.75      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 86.74      | ✅             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 86.68      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 86.56      | ✅             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 86.16      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 84.54      | ❌             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 84.41      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 84.25      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 83.8       | ❌             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 82.59      | ✅             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 81.53      | ✅             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 81.34      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 81.15      | ✅             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 81.05      | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 78.35      | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 76.56      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 76.0       | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 75.21      | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 75.14      | ❌             |
| ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 65.86      | ❌             |
| ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 56.87      | ❌             |
| ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 47.19      | ❌             |
| ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 43.36      | ❌             |
| ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 43.0       | ❌             |
| ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 41.81      | ✅             |
| ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 40.43      | ✅             |
| ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 40.41      | ❌             |
| ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 40.41      | ❌             |
| ViT-B-16__laion400m_e31                              | 991          | 5.04                | 37.71      | ✅             |
| ViT-B-16__laion400m_e32                              | 975          | 4.98                | 37.64      | ✅             |
| ViT-B-32__laion400m_e31                              | 999          | 2.28                | 36.04      | ✅             |
| ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 35.9       | ❌             |
| RN50x64__openai                                      | 5079         | 48.79               | 34.19      | ❌             |
| ViT-L-14__openai                                     | 2212         | 19.91               | 33.1       | ❌             |
| ViT-L-14-336__openai                                 | 2616         | 43.45               | 32.25      | ❌             |
| RN50x16__openai                                      | 2221         | 15.87               | 30.56      | ❌             |
| RN50x4__openai                                       | 1416         | 5.85                | 29.2       | ❌             |
| ViT-B-16__openai                                     | 985          | 5.03                | 25.77      | ❌             |
| RN101__openai                                        | 1111         | 3.21                | 25.46      | ❌             |
| RN50__openai                                         | 913          | 2.39                | 24.92      | ✅             |
| ViT-B-32__openai                                     | 1004         | 2.26                | 24.13      | ✅             |
</details>
<details>
<summary>Greek</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 74.58      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 73.28      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 71.28      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 69.16      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 68.21      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 64.69      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 61.64      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 61.03      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 60.63      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 60.41      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 60.1       | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 60.06      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 60.06      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 59.44      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 59.44      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 59.43      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 58.78      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 53.42      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 53.24      | ❌             |
</details>
<details>
<summary>Hebrew</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 88.04      | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 87.09      | ❌             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 83.93      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 83.84      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 80.78      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 74.59      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 72.73      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 72.25      | ❌             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 72.19      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 72.15      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 72.08      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 72.07      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 72.06      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 71.78      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 70.55      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 70.03      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 69.34      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 60.33      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 58.49      | ❌             |
</details>
<details>
<summary>Hindi</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 62.02      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 61.67      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 58.68      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 58.54      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 38.54      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 36.95      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 36.62      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 36.06      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 35.76      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 35.34      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 35.17      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 34.94      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 34.91      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 34.19      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 33.56      | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 32.06      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 31.85      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 27.87      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 27.08      | ❌             |
</details>
<details>
<summary>Hungarian</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 85.59      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 85.25      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 81.74      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 80.34      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 80.14      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 74.94      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 74.2       | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 74.03      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 73.96      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 73.95      | ✅             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 73.9       | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 73.59      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 73.12      | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 72.5       | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 72.33      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 71.83      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 70.57      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 58.31      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 56.74      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 38.26      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 37.97      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 28.75      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 28.26      | ❌             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 24.88      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 24.39      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 24.29      | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 24.16      | ❌             |
</details>
<details>
<summary>Indonesian</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 85.46      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 85.12      | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 85.01      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 84.99      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 84.65      | ❌             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 84.62      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 84.58      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 84.11      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 84.1       | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 84.06      | ✅             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 83.69      | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 83.61      | ❌             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 82.31      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 81.97      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 80.93      | ❌             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 79.84      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 77.12      | ✅             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 77.02      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 74.15      | ✅             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 71.44      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 69.94      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 65.87      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 65.19      | ❌             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 59.95      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 59.38      | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 57.88      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 57.52      | ✅             |
| ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 54.11      | ❌             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 50.02      | ❌             |
| ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 23.25      | ❌             |
</details>
<details>
<summary>Italian</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 87.17      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 86.91      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 86.83      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 86.77      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 86.67      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 86.42      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 86.35      | ✅             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 86.34      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 86.18      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 86.17      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 85.84      | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 85.8       | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 85.7       | ✅             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 85.67      | ❌             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 83.32      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 82.95      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 82.73      | ❌             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 82.72      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 81.07      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 80.8       | ✅             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 80.6       | ✅             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 80.35      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 78.79      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 76.62      | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 76.51      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 76.08      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 75.29      | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 75.29      | ❌             |
| ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 74.84      | ❌             |
| ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 56.32      | ❌             |
| ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 47.25      | ❌             |
| ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 43.09      | ❌             |
| ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 42.99      | ❌             |
| ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 40.29      | ❌             |
| ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 40.29      | ❌             |
| ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 39.67      | ✅             |
| ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 39.03      | ✅             |
| ViT-B-16__laion400m_e32                              | 975          | 4.98                | 36.14      | ✅             |
| ViT-B-16__laion400m_e31                              | 991          | 5.04                | 35.89      | ❌             |
| ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 35.59      | ❌             |
| ViT-B-32__laion400m_e31                              | 999          | 2.28                | 35.56      | ✅             |
| RN50x64__openai                                      | 5079         | 48.79               | 33.53      | ❌             |
| ViT-L-14__openai                                     | 2212         | 19.91               | 32.19      | ❌             |
| ViT-L-14-336__openai                                 | 2616         | 43.45               | 30.95      | ❌             |
| RN50x16__openai                                      | 2221         | 15.87               | 28.85      | ❌             |
| RN50x4__openai                                       | 1416         | 5.85                | 25.75      | ❌             |
| ViT-B-16__openai                                     | 985          | 5.03                | 25.18      | ❌             |
| RN101__openai                                        | 1111         | 3.21                | 24.48      | ❌             |
| RN50__openai                                         | 913          | 2.39                | 23.89      | ✅             |
| ViT-B-32__openai                                     | 1004         | 2.26                | 23.39      | ✅             |
</details>
<details>
<summary>Japanese</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 83.95      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 82.21      | ❌             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 81.55      | ❌             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 78.72      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 78.53      | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 75.93      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 66.86      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 65.59      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 65.48      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 65.36      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 64.47      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 64.17      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 64.08      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 63.69      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 63.33      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 63.02      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 58.39      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 56.38      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 53.16      | ❌             |
</details>
<details>
<summary>Korean</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 80.56      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 80.53      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 77.09      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 77.08      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 76.97      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 76.92      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 76.58      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 76.2       | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 75.95      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 75.86      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 75.67      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 75.49      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 74.6       | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 74.52      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 73.88      | ❌             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 71.09      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 68.87      | ✅             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 67.94      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 66.39      | ✅             |
</details>
<details>
<summary>Maori</summary>
| Model                       | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|-----------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl | 4248         | 75.44               | 48.43      | ✅             |
| nllb-clip-large-siglip__v1  | 4226         | 75.05               | 46.12      | ✅             |
| nllb-clip-base-siglip__mrl  | 4696         | 16.95               | 42.8       | ✅             |
| nllb-clip-base-siglip__v1   | 4675         | 15.17               | 40.85      | ✅             |
</details>
<details>
<summary>Norwegian</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 81.36      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 80.96      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 77.65      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 76.39      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 75.97      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 75.44      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 75.31      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 75.0       | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 74.96      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 74.92      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 74.44      | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 74.37      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 73.11      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 72.63      | ✅             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 71.71      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 67.81      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 65.55      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 62.56      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 60.94      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 59.62      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 59.49      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 46.3       | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 45.75      | ❌             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 42.55      | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 35.33      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 35.01      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 34.94      | ❌             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 34.39      | ❌             |
</details>
<details>
<summary>Persian</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 79.52      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 78.99      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 76.32      | ✅             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 76.3       | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 76.11      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 75.56      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 75.38      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 74.92      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 74.86      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 74.73      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 74.32      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 74.31      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 73.42      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 72.56      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 71.9       | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 69.79      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 68.55      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 68.26      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 65.16      | ❌             |
</details>
<details>
<summary>Polish</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 83.49      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 83.45      | ❌             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 83.11      | ✅             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 82.99      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 82.96      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 82.93      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 82.61      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 82.26      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 82.24      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 82.03      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 82.03      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 81.92      | ✅             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 81.27      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 80.0       | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 79.65      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 76.75      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 76.52      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 75.1       | ✅             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 73.9       | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 65.03      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 64.89      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 51.6       | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 51.29      | ❌             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 46.15      | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 41.55      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 41.17      | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 40.9       | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 40.76      | ✅             |
</details>
<details>
<summary>Portuguese</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 82.12      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 81.84      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 81.69      | ✅             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 81.69      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 81.54      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 81.39      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 80.56      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 80.34      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 80.02      | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 79.99      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 79.93      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 79.61      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 79.12      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 78.87      | ❌             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 78.85      | ❌             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 77.54      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 75.31      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 75.26      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 74.82      | ✅             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 74.48      | ❌             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 74.47      | ❌             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 73.92      | ✅             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 73.58      | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 73.02      | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 71.44      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 71.16      | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 69.69      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 69.32      | ✅             |
| ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 59.86      | ❌             |
| ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 45.49      | ❌             |
| ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 37.86      | ❌             |
| ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 36.01      | ❌             |
| ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 35.75      | ❌             |
| ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 33.25      | ❌             |
| ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 33.25      | ❌             |
| ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 32.83      | ✅             |
| ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 32.62      | ✅             |
| ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 30.86      | ❌             |
| ViT-B-32__laion400m_e31                              | 999          | 2.28                | 30.8       | ✅             |
| RN50x64__openai                                      | 5079         | 48.79               | 30.58      | ❌             |
| ViT-B-16__laion400m_e32                              | 975          | 4.98                | 30.18      | ✅             |
| ViT-B-16__laion400m_e31                              | 991          | 5.04                | 29.93      | ❌             |
| ViT-L-14__openai                                     | 2212         | 19.91               | 28.88      | ❌             |
| ViT-L-14-336__openai                                 | 2616         | 43.45               | 28.49      | ❌             |
| RN50x16__openai                                      | 2221         | 15.87               | 23.9       | ❌             |
| RN50x4__openai                                       | 1416         | 5.85                | 22.94      | ❌             |
| ViT-B-16__openai                                     | 985          | 5.03                | 22.55      | ❌             |
| RN50__openai                                         | 913          | 2.39                | 21.85      | ✅             |
| ViT-B-32__openai                                     | 1004         | 2.26                | 21.3       | ✅             |
| RN101__openai                                        | 1111         | 3.21                | 21.14      | ❌             |
</details>
<details>
<summary>Romanian</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 89.38      | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 88.86      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 85.37      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 84.92      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 84.49      | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 77.92      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 74.98      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 74.33      | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 74.05      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 74.03      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 73.94      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 73.27      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 73.22      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 72.91      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 72.43      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 71.93      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 71.5       | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 58.28      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 56.54      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 56.12      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 55.53      | ❌             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 34.96      | ✅             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 26.33      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 26.05      | ❌             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 21.32      | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 21.04      | ❌             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 20.76      | ❌             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 20.56      | ✅             |
</details>
<details>
<summary>Russian</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 84.54      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 84.41      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 84.36      | ❌             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 84.31      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 84.22      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 83.9       | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 83.69      | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 83.5       | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 83.31      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 83.21      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 83.11      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 82.7       | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 82.69      | ❌             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 80.91      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 79.75      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 79.35      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 78.91      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 78.06      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 76.44      | ✅             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 42.81      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 42.1       | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 24.95      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 24.25      | ❌             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 20.85      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 20.44      | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 20.41      | ❌             |
</details>
<details>
<summary>Spanish</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 85.47      | ✅             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 85.44      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 85.32      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 85.22      | ❌             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 85.15      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 84.81      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 84.68      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 84.6       | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 84.55      | ✅             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 84.27      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 84.15      | ✅             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 83.87      | ❌             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 83.74      | ❌             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 83.61      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 83.15      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 81.7       | ❌             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 80.91      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 80.73      | ✅             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 80.69      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 80.3       | ❌             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 79.8       | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 79.71      | ✅             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 79.64      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 78.0       | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 77.83      | ❌             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 76.87      | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 76.66      | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 75.99      | ✅             |
| ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 71.96      | ❌             |
| ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 62.06      | ❌             |
| ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 53.78      | ❌             |
| ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 50.13      | ❌             |
| ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 50.0       | ❌             |
| ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 47.39      | ❌             |
| ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 47.39      | ❌             |
| ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 46.47      | ✅             |
| ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 45.68      | ✅             |
| ViT-B-16__laion400m_e31                              | 991          | 5.04                | 44.0       | ✅             |
| ViT-B-16__laion400m_e32                              | 975          | 4.98                | 43.98      | ✅             |
| ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 43.8       | ❌             |
| ViT-B-32__laion400m_e31                              | 999          | 2.28                | 43.73      | ✅             |
| RN50x64__openai                                      | 5079         | 48.79               | 43.01      | ❌             |
| ViT-L-14__openai                                     | 2212         | 19.91               | 42.96      | ❌             |
| ViT-L-14-336__openai                                 | 2616         | 43.45               | 41.67      | ❌             |
| RN50x16__openai                                      | 2221         | 15.87               | 40.21      | ❌             |
| RN50x4__openai                                       | 1416         | 5.85                | 36.06      | ❌             |
| ViT-B-16__openai                                     | 985          | 5.03                | 35.67      | ❌             |
| RN101__openai                                        | 1111         | 3.21                | 34.62      | ❌             |
| ViT-B-32__openai                                     | 1004         | 2.26                | 32.6       | ✅             |
| RN50__openai                                         | 913          | 2.39                | 31.79      | ✅             |
</details>
<details>
<summary>Swahili</summary>
| Model                           | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|---------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl     | 4248         | 75.44               | 69.51      | ✅             |
| nllb-clip-large-siglip__v1      | 4226         | 75.05               | 68.44      | ✅             |
| nllb-clip-base-siglip__mrl      | 4696         | 16.95               | 66.09      | ✅             |
| nllb-clip-base-siglip__v1       | 4675         | 15.17               | 63.98      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli | 3029         | 6.87                | 21.64      | ✅             |
</details>
<details>
<summary>Swedish</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 77.12      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 76.37      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 73.41      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 72.83      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 72.51      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 72.2       | ❌             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 72.1       | ✅             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 72.06      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 71.84      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 71.7       | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 71.7       | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 71.61      | ❌             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 71.51      | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 71.45      | ✅             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 71.23      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 67.48      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 66.93      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 66.37      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 64.86      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 62.35      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 61.51      | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 56.74      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 55.92      | ❌             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 48.5       | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 48.38      | ✅             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 48.06      | ❌             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 47.99      | ❌             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 47.93      | ❌             |
| ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 29.98      | ❌             |
</details>
<details>
<summary>Telugu</summary>
| Model                       | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|-----------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl | 4248         | 75.44               | 64.32      | ✅             |
| nllb-clip-large-siglip__v1  | 4226         | 75.05               | 62.34      | ✅             |
| nllb-clip-base-siglip__mrl  | 4696         | 16.95               | 60.72      | ✅             |
| nllb-clip-base-siglip__v1   | 4675         | 15.17               | 58.8       | ✅             |
</details>
<details>
<summary>Thai</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 79.99      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 79.07      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 76.13      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 75.23      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 74.04      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 66.03      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 45.87      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 45.69      | ❌             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 45.52      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 44.96      | ❌             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 44.75      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 44.66      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 43.99      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 43.91      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 43.06      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 41.86      | ❌             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 41.1       | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 37.35      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 35.28      | ❌             |
</details>
<details>
<summary>Turkish</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 83.91      | ✅             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 83.74      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 81.26      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 80.21      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 79.34      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 79.22      | ✅             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 78.9       | ✅             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 78.85      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 78.29      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 78.27      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 78.0       | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 77.81      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 77.67      | ✅             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 77.33      | ✅             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 76.42      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 72.44      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 69.84      | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 69.83      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 67.13      | ❌             |
| ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 44.43      | ❌             |
| ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 43.87      | ❌             |
| ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 35.1       | ❌             |
| ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 34.92      | ❌             |
| ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 25.2       | ✅             |
| ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 24.55      | ✅             |
| ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 24.13      | ✅             |
| ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 24.08      | ❌             |
| ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 23.95      | ❌             |
</details>
<details>
<summary>Ukrainian</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 83.92      | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 83.88      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 83.2       | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 79.99      | ✅             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 79.31      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 78.73      | ✅             |
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 78.33      | ✅             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 77.95      | ❌             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 77.56      | ✅             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 77.49      | ✅             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 77.02      | ❌             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 76.87      | ❌             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 76.31      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 75.91      | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 75.75      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 75.1       | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 73.3       | ✅             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 65.28      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 63.95      | ❌             |
</details>
<details>
<summary>Vietnamese</summary>
| Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
|------------------------------------------------------|--------------|---------------------|------------|----------------|
| ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 85.86      | ✅             |
| ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 85.73      | ❌             |
| ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 85.67      | ❌             |
| ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 85.5       | ❌             |
| ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 84.93      | ✅             |
| ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 84.84      | ✅             |
| ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 84.78      | ❌             |
| ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 84.34      | ✅             |
| ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 84.33      | ❌             |
| ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 83.93      | ✅             |
| nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 83.69      | ❌             |
| nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 83.19      | ❌             |
| XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 81.88      | ❌             |
| ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 80.88      | ✅             |
| nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 79.79      | ❌             |
| nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 79.38      | ❌             |
| ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 77.73      | ✅             |
| XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 75.18      | ✅             |
| ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 73.05      | ✅             |
</details>

:::note
Feel free to make a feature request if there's a model you want to use that we don't currently support.
:::

[huggingface-clip]: https://huggingface.co/collections/immich-app/clip-654eaefb077425890874cd07
[huggingface-multilingual-clip]: https://huggingface.co/collections/immich-app/multilingual-clip-654eb08c2382f591eeb8c2a7
[smart-search-settings]: https://my.immich.app/admin/system-settings?isOpen=machine-learning+smart-search
[job-status-page]: https://my.immich.app/admin/jobs-status
