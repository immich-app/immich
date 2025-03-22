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

<img src={require('./img/moblie-smart-serach.webp').default} width="30%" title='Smart search on mobile' />

</TabItem>
</Tabs>

## Configuration

Navigating to `Administration > Settings > Machine Learning Settings > Smart Search` will show the options available.

### CLIP models

More powerful models can be used for more accurate search results, but are slower and can require more server resources. Check the dropdown below to see how they compare in memory usage, speed and quality by language.

<detail><summary>Model Estimates</summary>

This section lists how models perform on various languages. Please note that memory and execution time values are only _estimates_: actual usage will be different depending on many factors. As such, it's mainly intended as a way to compare the relative tradeoffs of each model.

  <details><summary>Reference</summary>

Memory and execution time estimates were obtained without acceleration on a 7800x3D processor running bare metal Linux. All testing and evaluation was done at f32 precision (the default in Immich).

Execution Time (ms): After warming up the model with one pass, the mean execution time of 100 passes with the same input.
Memory (MiB): The peak RSS usage of the process afer performing the above timing benchmark. Does not include image decoding, concurrent processing, the web server, etc., which are relatively constant factors.
Recall (%): Evaluated on Crossmodal-3600, the average of the recall@1, recall@5 and recall@10 results for zeroshot image retrieval.
Pareto Optimal: Whether the model is not completely outclassed by another model. Specifically, whether there's a model that's better for a given language in at least one respect (memory usage, execution time, recall) while being at least as good for that language in every other way. Avoid models that are not optimal.

  </details>

---

  <details><summary>English</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 75.73      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 75.44      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 75.19      | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 75.09      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 75.07      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 75.01      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 74.92      | false          |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 74.9       | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 74.87      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 74.87      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 74.77      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 74.28      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 74.26      | true           |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 73.15      | true           |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 72.78      | true           |
  | ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 72.58      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 72.57      | false          |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 72.47      | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 72.45      | true           |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 72.44      | false          |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 72.37      | false          |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 71.64      | true           |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 71.63      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 71.45      | false          |
  | ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 71.33      | false          |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 71.19      | false          |
  | ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 69.86      | false          |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 69.66      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 69.38      | false          |
  | ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 68.78      | true           |
  | ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 68.53      | false          |
  | ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 68.53      | false          |
  | ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 68.53      | false          |
  | ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 68.51      | false          |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 68.41      | false          |
  | ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 68.41      | false          |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 68.33      | false          |
  | ViT-B-16__laion400m_e31                              | 991          | 5.04                | 66.96      | true           |
  | ViT-B-16__laion400m_e32                              | 975          | 4.98                | 66.95      | true           |
  | ViT-B-32__laion400m_e31                              | 999          | 2.28                | 65.65      | true           |
  | ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 65.49      | false          |
  | ViT-L-14__openai                                     | 2212         | 19.91               | 60.12      | false          |
  | ViT-B-32__openai                                     | 1004         | 2.26                | 59.37      | true           |
  | RN50x64__openai                                      | 5079         | 48.79               | 59.36      | false          |
  | RN50x16__openai                                      | 2221         | 15.87               | 59.17      | false          |
  | ViT-L-14-336__openai                                 | 2616         | 43.45               | 59.09      | false          |
  | RN50__openai                                         | 913          | 2.39                | 58.32      | true           |
  | ViT-B-16__openai                                     | 985          | 5.03                | 58.27      | false          |
  | RN50x4__openai                                       | 1416         | 5.85                | 57.88      | false          |
  | RN50__cc12m                                          | 914          | 2.37                | 57.75      | true           |
  | RN101__openai                                        | 1111         | 3.21                | 57.7       | false          |
  | RN101__yfcc15m                                       | 1111         | 3.22                | 50.11      | false          |
  | RN50__yfcc15m                                        | 908          | 2.34                | 48.28      | true           |
  </details>
  <details><summary>Arabic</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 77.3       | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 76.44      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 74.03      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 73.19      | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 69.31      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 69.29      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 69.29      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 68.64      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 68.35      | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 68.25      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 68.23      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 67.56      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 67.28      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 66.89      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 66.52      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 64.1       | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 61.71      | true           |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 60.7       | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 59.66      | true           |
  </details>
  <details><summary>Bengali</summary>
  | Model                            | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |----------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__v1       | 4226         | 75.05               | 76.16      | true           |
  | nllb-clip-large-siglip__mrl      | 4248         | 75.44               | 75.83      | false          |
  | nllb-clip-base-siglip__mrl       | 4696         | 16.95               | 73.75      | true           |
  | nllb-clip-base-siglip__v1        | 4675         | 15.17               | 73.34      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli  | 3029         | 6.87                | 36.43      | true           |
  | ViT-SO400M-14-SigLIP2__webli     | 3622         | 27.63               | 26.56      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli | 3611         | 27.84               | 26.54      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli | 3940         | 72.25               | 26.19      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli | 3854         | 56.57               | 26.19      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli | 4050         | 107.67              | 25.92      | false          |
  | ViT-gopt-16-SigLIP2-384__webli   | 6585         | 146.84              | 25.15      | false          |
  | ViT-gopt-16-SigLIP2-256__webli   | 6475         | 64.51               | 24.18      | false          |
  | ViT-L-16-SigLIP2-384__webli      | 3057         | 51.7                | 21.44      | false          |
  | ViT-L-16-SigLIP2-512__webli      | 3358         | 92.59               | 21.11      | false          |
  | ViT-L-16-SigLIP2-256__webli      | 2830         | 23.77               | 20.94      | true           |
  </details>
  <details><summary>Chinese (Simplified)</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 77.49      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 77.19      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 76.98      | false          |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 72.89      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 72.65      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 72.52      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 67.83      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 67.81      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 67.51      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 67.39      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 67.33      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 67.23      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 67.05      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 66.87      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 66.24      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 66.1       | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 65.56      | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 64.39      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 62.56      | false          |
  </details>
  <details><summary>Croatian</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 87.46      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 87.19      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 82.98      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 82.92      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 81.93      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 73.77      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 73.21      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 73.2       | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 72.95      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 72.89      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 72.88      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 72.85      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 72.69      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 70.73      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 70.45      | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 70.43      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 69.97      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 54.31      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 53.3       | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 35.64      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 35.17      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 33.65      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 33.55      | false          |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 20.05      | true           |
  </details>
  <details><summary>Cusco Quechua</summary>
  | Model                       | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |-----------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl | 4248         | 75.44               | 38.08      | true           |
  | nllb-clip-large-siglip__v1  | 4226         | 75.05               | 37.87      | true           |
  | nllb-clip-base-siglip__mrl  | 4696         | 16.95               | 33.41      | true           |
  | nllb-clip-base-siglip__v1   | 4675         | 15.17               | 33.06      | true           |
  </details>
  <details><summary>Czech</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 73.76      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 71.57      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 69.86      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 67.49      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 67.15      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 63.62      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 63.35      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 63.09      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 63.07      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 62.98      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 62.82      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 62.73      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 62.29      | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 62.12      | true           |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 61.74      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 61.52      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 61.01      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 54.81      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 54.31      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 33.58      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 33.48      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 32.38      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 32.32      | false          |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 22.89      | true           |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 22.66      | false          |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 22.6       | false          |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 22.25      | false          |
  </details>
  <details><summary>Danish</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 87.16      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 86.88      | false          |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 84.18      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 84.03      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 83.75      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 83.32      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 83.25      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 82.3       | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 82.19      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 81.87      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 81.44      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 81.42      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 80.0       | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 79.82      | true           |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 79.08      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 75.07      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 74.84      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 67.68      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 67.2       | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 65.59      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 65.36      | false          |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 42.31      | true           |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 41.46      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 40.52      | false          |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 31.31      | true           |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 30.97      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 30.87      | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 30.51      | false          |
  </details>
  <details><summary>Dutch</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 80.05      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 79.81      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 79.72      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 79.72      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 79.64      | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 79.49      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 79.41      | false          |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 79.31      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 78.92      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 78.48      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 78.22      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 78.0       | true           |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 77.22      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 76.69      | false          |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 75.94      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 75.6       | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 75.33      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 75.04      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 72.97      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 72.72      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 72.06      | true           |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 72.06      | false          |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 70.81      | true           |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 69.82      | true           |
  | ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 67.54      | false          |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 66.77      | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 66.6       | true           |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 65.67      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 65.29      | true           |
  | ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 41.1       | false          |
  | ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 34.29      | false          |
  | ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 29.65      | false          |
  | ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 29.56      | false          |
  | ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 29.54      | true           |
  | ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 29.36      | false          |
  | ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 27.76      | false          |
  | ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 27.76      | false          |
  | ViT-B-16__laion400m_e32                              | 975          | 4.98                | 25.67      | true           |
  | ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 25.59      | false          |
  | ViT-B-16__laion400m_e31                              | 991          | 5.04                | 25.53      | false          |
  | ViT-B-32__laion400m_e31                              | 999          | 2.28                | 25.52      | true           |
  | ViT-L-14__openai                                     | 2212         | 19.91               | 22.31      | false          |
  | RN50x64__openai                                      | 5079         | 48.79               | 22.27      | false          |
  | ViT-L-14-336__openai                                 | 2616         | 43.45               | 21.8       | false          |
  | RN50x16__openai                                      | 2221         | 15.87               | 20.69      | false          |
  </details>
  <details><summary>Filipino</summary>
  | Model                            | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |----------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl      | 4248         | 75.44               | 67.57      | true           |
  | nllb-clip-large-siglip__v1       | 4226         | 75.05               | 65.64      | true           |
  | nllb-clip-base-siglip__mrl       | 4696         | 16.95               | 61.21      | true           |
  | nllb-clip-base-siglip__v1        | 4675         | 15.17               | 59.42      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli  | 3029         | 6.87                | 36.81      | true           |
  | ViT-gopt-16-SigLIP2-384__webli   | 6585         | 146.84              | 35.72      | false          |
  | ViT-gopt-16-SigLIP2-256__webli   | 6475         | 64.51               | 34.75      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli | 3940         | 72.25               | 34.63      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli | 4050         | 107.67              | 34.39      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli | 3854         | 56.57               | 34.27      | false          |
  | ViT-SO400M-14-SigLIP2__webli     | 3622         | 27.63               | 34.14      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli | 3611         | 27.84               | 33.98      | false          |
  | ViT-L-16-SigLIP2-512__webli      | 3358         | 92.59               | 30.57      | false          |
  | ViT-L-16-SigLIP2-384__webli      | 3057         | 51.7                | 30.57      | false          |
  | ViT-L-16-SigLIP2-256__webli      | 2830         | 23.77               | 30.05      | true           |
  | ViT-L-16-SigLIP-384__webli       | 3396         | 47.6                | 24.92      | false          |
  | ViT-L-16-SigLIP-256__webli       | 3160         | 23.84               | 24.02      | false          |
  | ViT-B-16-SigLIP2__webli          | 3038         | 5.81                | 23.37      | true           |
  | ViT-B-32-SigLIP2-256__webli      | 3061         | 3.31                | 22.69      | true           |
  </details>
  <details><summary>Finnish</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 84.27      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 83.93      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 79.41      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 78.94      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 75.49      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 63.46      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 63.16      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 63.08      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 63.03      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 62.28      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 61.92      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 61.81      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 61.76      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 61.05      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 57.8       | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 57.69      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 57.05      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 40.26      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 40.06      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 31.75      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 31.74      | false          |
  </details>
  <details><summary>French</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 88.01      | true           |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 87.74      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 87.69      | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 87.6       | true           |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 87.58      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 87.51      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 87.23      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 86.9       | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 86.9       | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 86.44      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 86.44      | false          |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 86.28      | false          |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 86.11      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 86.08      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 84.49      | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 84.3       | true           |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 83.03      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 82.93      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 82.27      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 82.14      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 80.96      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 80.64      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 80.28      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 79.65      | true           |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 77.4       | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 76.88      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 76.3       | true           |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 75.68      | false          |
  | ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 69.59      | false          |
  | ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 68.36      | false          |
  | ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 61.78      | false          |
  | ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 58.4       | false          |
  | ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 58.35      | false          |
  | ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 57.17      | false          |
  | ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 57.17      | false          |
  | ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 57.05      | true           |
  | ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 56.08      | true           |
  | ViT-B-16__laion400m_e31                              | 991          | 5.04                | 52.96      | true           |
  | ViT-B-16__laion400m_e32                              | 975          | 4.98                | 52.83      | true           |
  | ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 51.88      | false          |
  | ViT-B-32__laion400m_e31                              | 999          | 2.28                | 51.82      | true           |
  | RN50x64__openai                                      | 5079         | 48.79               | 42.86      | false          |
  | ViT-L-14-336__openai                                 | 2616         | 43.45               | 42.81      | false          |
  | ViT-L-14__openai                                     | 2212         | 19.91               | 42.54      | false          |
  | RN50x16__openai                                      | 2221         | 15.87               | 41.72      | false          |
  | RN50x4__openai                                       | 1416         | 5.85                | 38.85      | false          |
  | RN101__openai                                        | 1111         | 3.21                | 36.79      | false          |
  | ViT-B-16__openai                                     | 985          | 5.03                | 36.47      | false          |
  | ViT-B-32__openai                                     | 1004         | 2.26                | 35.17      | true           |
  | RN50__openai                                         | 913          | 2.39                | 34.44      | true           |
  </details>
  <details><summary>German</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 90.04      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 89.97      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 89.85      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 89.81      | true           |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 89.77      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 89.69      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 89.45      | true           |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 89.44      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 89.39      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 89.35      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 89.03      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 88.82      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 88.55      | false          |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 88.42      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 87.19      | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 86.44      | true           |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 84.81      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 84.81      | false          |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 84.58      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 84.44      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 83.33      | true           |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 82.75      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 82.32      | false          |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 81.63      | true           |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 76.76      | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 76.33      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 75.19      | true           |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 75.07      | false          |
  | ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 64.61      | false          |
  | ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 52.81      | false          |
  | ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 42.88      | false          |
  | ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 38.65      | false          |
  | ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 38.37      | false          |
  | ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 37.65      | true           |
  | ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 36.6       | true           |
  | ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 35.44      | false          |
  | ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 35.44      | false          |
  | ViT-B-16__laion400m_e31                              | 991          | 5.04                | 32.46      | true           |
  | ViT-B-16__laion400m_e32                              | 975          | 4.98                | 32.31      | true           |
  | ViT-B-32__laion400m_e31                              | 999          | 2.28                | 31.85      | true           |
  | ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 31.81      | false          |
  | RN50x64__openai                                      | 5079         | 48.79               | 28.41      | false          |
  | ViT-L-14__openai                                     | 2212         | 19.91               | 27.63      | false          |
  | ViT-L-14-336__openai                                 | 2616         | 43.45               | 27.09      | false          |
  | RN50x16__openai                                      | 2221         | 15.87               | 24.48      | false          |
  | RN50x4__openai                                       | 1416         | 5.85                | 23.49      | false          |
  | RN50__openai                                         | 913          | 2.39                | 20.91      | true           |
  | ViT-B-16__openai                                     | 985          | 5.03                | 20.83      | false          |
  | RN101__openai                                        | 1111         | 3.21                | 20.39      | false          |
  </details>
  <details><summary>Greek</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 74.58      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 73.28      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 71.28      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 69.16      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 68.21      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 64.69      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 61.64      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 61.03      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 60.63      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 60.41      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 60.1       | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 60.06      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 60.06      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 59.44      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 59.44      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 59.43      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 58.78      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 53.42      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 53.24      | false          |
  </details>
  <details><summary>Hebrew</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 88.04      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 87.09      | false          |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 83.93      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 83.84      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 80.78      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 74.59      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 72.73      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 72.25      | false          |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 72.19      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 72.15      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 72.08      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 72.07      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 72.06      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 71.78      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 70.55      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 70.03      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 69.34      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 60.33      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 58.49      | false          |
  </details>
  <details><summary>Hindi</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 62.02      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 61.67      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 58.68      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 58.54      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 38.54      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 36.95      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 36.62      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 36.06      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 35.76      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 35.34      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 35.17      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 34.94      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 34.91      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 34.19      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 33.56      | false          |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 32.06      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 31.85      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 27.87      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 27.08      | false          |
  </details>
  <details><summary>Hungarian</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 85.59      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 85.25      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 81.74      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 80.34      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 80.14      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 74.94      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 74.2       | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 74.03      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 73.96      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 73.95      | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 73.9       | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 73.59      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 73.12      | false          |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 72.5       | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 72.33      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 71.83      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 70.57      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 58.31      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 56.74      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 38.26      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 37.97      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 28.75      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 28.26      | false          |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 24.88      | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 24.39      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 24.29      | true           |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 24.16      | false          |
  </details>
  <details><summary>Indonesian</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 85.46      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 85.12      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 85.01      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 84.99      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 84.65      | false          |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 84.62      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 84.58      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 84.11      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 84.1       | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 84.06      | true           |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 83.69      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 83.61      | false          |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 82.31      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 81.97      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 80.93      | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 79.84      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 77.12      | true           |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 77.02      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 74.15      | true           |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 71.44      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 69.94      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 65.87      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 65.19      | false          |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 59.95      | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 59.38      | true           |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 57.88      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 57.52      | true           |
  | ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 54.11      | false          |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 50.02      | false          |
  | ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 23.25      | false          |
  </details>
  <details><summary>Italian</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 88.6       | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 88.25      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 88.12      | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 88.04      | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 87.97      | false          |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 87.69      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 87.29      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 87.06      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 86.91      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 86.88      | true           |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 86.68      | true           |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 86.61      | false          |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 85.55      | false          |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 85.37      | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 83.78      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 83.0       | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 81.81      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 81.77      | false          |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 81.32      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 80.97      | false          |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 80.53      | true           |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 80.1       | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 79.71      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 77.31      | true           |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 75.19      | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 74.49      | true           |
  | ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 74.04      | false          |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 73.68      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 73.57      | true           |
  | ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 51.04      | false          |
  | ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 41.73      | false          |
  | ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 36.87      | false          |
  | ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 36.84      | false          |
  | ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 34.68      | false          |
  | ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 34.68      | false          |
  | ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 34.64      | true           |
  | ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 33.8       | true           |
  | ViT-B-16__laion400m_e32                              | 975          | 4.98                | 30.11      | true           |
  | ViT-B-16__laion400m_e31                              | 991          | 5.04                | 30.04      | false          |
  | ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 29.89      | false          |
  | ViT-B-32__laion400m_e31                              | 999          | 2.28                | 29.88      | true           |
  | RN50x64__openai                                      | 5079         | 48.79               | 26.67      | false          |
  | ViT-L-14__openai                                     | 2212         | 19.91               | 25.51      | false          |
  | ViT-L-14-336__openai                                 | 2616         | 43.45               | 25.3       | false          |
  | RN50x16__openai                                      | 2221         | 15.87               | 21.37      | false          |
  </details>
  <details><summary>Japanese</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 86.97      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 85.15      | false          |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 84.69      | false          |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 81.77      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 81.26      | false          |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 81.19      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 69.99      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 68.58      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 68.35      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 68.29      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 67.99      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 67.68      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 67.67      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 66.85      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 66.54      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 65.77      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 61.48      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 58.1       | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 55.31      | false          |
  </details>
  <details><summary>Korean</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 77.21      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 76.89      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 75.72      | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 75.06      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 74.94      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 74.36      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 74.09      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 73.61      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 73.55      | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 73.41      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 73.18      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 72.79      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 72.27      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 71.73      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 71.12      | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 70.25      | true           |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 67.54      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 67.37      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 65.44      | true           |
  </details>
  <details><summary>Maori</summary>
  | Model                       | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |-----------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl | 4248         | 75.44               | 48.43      | true           |
  | nllb-clip-large-siglip__v1  | 4226         | 75.05               | 46.12      | true           |
  | nllb-clip-base-siglip__mrl  | 4696         | 16.95               | 42.8       | true           |
  | nllb-clip-base-siglip__v1   | 4675         | 15.17               | 40.85      | true           |
  </details>
  <details><summary>Norwegian</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 81.36      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 80.96      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 77.65      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 76.39      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 75.97      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 75.44      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 75.31      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 75.0       | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 74.96      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 74.92      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 74.44      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 74.37      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 73.11      | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 72.63      | true           |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 71.71      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 67.81      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 65.55      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 62.56      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 60.94      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 59.62      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 59.49      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 46.3       | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 45.75      | false          |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 42.55      | true           |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 35.33      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 35.01      | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 34.94      | false          |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 34.39      | false          |
  </details>
  <details><summary>Persian</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 79.52      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 78.99      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 76.32      | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 76.3       | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 76.11      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 75.56      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 75.38      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 74.92      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 74.86      | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 74.73      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 74.32      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 74.31      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 73.42      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 72.56      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 71.9       | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 69.79      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 68.55      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 68.26      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 65.16      | false          |
  </details>
  <details><summary>Polish</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 80.6       | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 80.17      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 80.06      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 80.04      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 79.98      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 79.8       | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 79.72      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 79.66      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 79.45      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 79.26      | false          |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 79.21      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 79.14      | true           |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 78.23      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 75.33      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 74.7       | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 74.63      | false          |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 73.69      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 73.44      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 70.34      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 59.4       | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 59.14      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 48.74      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 48.35      | false          |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 40.76      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 39.13      | true           |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 39.09      | false          |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 38.55      | false          |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 38.46      | false          |
  </details>
  <details><summary>Portuguese</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 82.12      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 81.84      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 81.69      | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 81.69      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 81.54      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 81.39      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 80.56      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 80.34      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 80.02      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 79.99      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 79.93      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 79.61      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 79.12      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 78.87      | false          |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 78.85      | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 77.54      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 75.31      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 75.26      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 74.82      | true           |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 74.48      | false          |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 74.47      | false          |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 73.92      | true           |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 73.58      | false          |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 73.02      | true           |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 71.44      | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 71.16      | true           |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 69.69      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 69.32      | true           |
  | ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 59.86      | false          |
  | ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 45.49      | false          |
  | ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 37.86      | false          |
  | ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 36.01      | false          |
  | ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 35.75      | false          |
  | ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 33.25      | false          |
  | ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 33.25      | false          |
  | ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 32.83      | true           |
  | ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 32.62      | true           |
  | ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 30.86      | false          |
  | ViT-B-32__laion400m_e31                              | 999          | 2.28                | 30.8       | true           |
  | RN50x64__openai                                      | 5079         | 48.79               | 30.58      | false          |
  | ViT-B-16__laion400m_e32                              | 975          | 4.98                | 30.18      | true           |
  | ViT-B-16__laion400m_e31                              | 991          | 5.04                | 29.93      | false          |
  | ViT-L-14__openai                                     | 2212         | 19.91               | 28.88      | false          |
  | ViT-L-14-336__openai                                 | 2616         | 43.45               | 28.49      | false          |
  | RN50x16__openai                                      | 2221         | 15.87               | 23.9       | false          |
  | RN50x4__openai                                       | 1416         | 5.85                | 22.94      | false          |
  | ViT-B-16__openai                                     | 985          | 5.03                | 22.55      | false          |
  | RN50__openai                                         | 913          | 2.39                | 21.85      | true           |
  | ViT-B-32__openai                                     | 1004         | 2.26                | 21.3       | true           |
  | RN101__openai                                        | 1111         | 3.21                | 21.14      | false          |
  </details>
  <details><summary>Romanian</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 89.38      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 88.86      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 85.37      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 84.92      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 84.49      | false          |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 77.92      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 74.98      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 74.33      | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 74.05      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 74.03      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 73.94      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 73.27      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 73.22      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 72.91      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 72.43      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 71.93      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 71.5       | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 58.28      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 56.54      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 56.12      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 55.53      | false          |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 34.96      | true           |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 26.33      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 26.05      | false          |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 21.32      | true           |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 21.04      | false          |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 20.76      | false          |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 20.56      | true           |
  </details>
  <details><summary>Russian</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 87.65      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 87.62      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 87.4       | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 87.39      | false          |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 86.88      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 86.87      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 86.74      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 86.26      | true           |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 85.98      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 85.66      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 85.54      | false          |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 84.69      | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 84.29      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 84.24      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 82.86      | true           |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 81.59      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 80.56      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 80.44      | false          |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 79.99      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 39.51      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 39.16      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 23.33      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 22.4       | false          |
  </details>
  <details><summary>Spanish</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 84.24      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 83.94      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 83.91      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 83.78      | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 83.71      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 83.59      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 83.2       | true           |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 83.0       | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 82.91      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 82.58      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 82.5       | true           |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 82.48      | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 82.22      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 81.34      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 80.18      | false          |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 80.14      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 78.99      | true           |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 78.19      | true           |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 78.15      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 77.93      | true           |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 77.64      | false          |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 77.21      | false          |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 76.36      | false          |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 75.73      | true           |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 75.56      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 75.01      | true           |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 74.62      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 74.6       | true           |
  | ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 70.31      | false          |
  | ViT-H-14__laion2b-s32b-b79k                          | 4676         | 39.06               | 58.31      | false          |
  | ViT-L-14__laion2b-s32b-b82k                          | 2233         | 20.56               | 49.56      | false          |
  | ViT-L-14__laion400m_e32                              | 2218         | 19.73               | 46.69      | false          |
  | ViT-L-14__laion400m_e31                              | 2183         | 19.87               | 46.53      | false          |
  | ViT-B-16-plus-240__laion400m_e31                     | 1263         | 6.94                | 44.05      | false          |
  | ViT-B-16-plus-240__laion400m_e32                     | 1246         | 6.95                | 44.05      | false          |
  | ViT-B-32__laion2b_e16                                | 1004         | 2.38                | 43.67      | true           |
  | ViT-B-32__laion2b-s34b-b79k                          | 1001         | 2.29                | 42.5       | true           |
  | ViT-B-16__laion400m_e32                              | 975          | 4.98                | 41.03      | true           |
  | ViT-B-16__laion400m_e31                              | 991          | 5.04                | 40.91      | false          |
  | ViT-B-32__laion400m_e31                              | 999          | 2.28                | 40.3       | true           |
  | ViT-B-32__laion400m_e32                              | 1003         | 2.35                | 40.3       | false          |
  | RN50x64__openai                                      | 5079         | 48.79               | 37.92      | false          |
  | ViT-L-14-336__openai                                 | 2616         | 43.45               | 37.7       | false          |
  | ViT-L-14__openai                                     | 2212         | 19.91               | 37.59      | false          |
  | RN50x16__openai                                      | 2221         | 15.87               | 34.75      | false          |
  | ViT-B-16__openai                                     | 985          | 5.03                | 32.1       | false          |
  | RN50x4__openai                                       | 1416         | 5.85                | 32.08      | false          |
  | RN101__openai                                        | 1111         | 3.21                | 30.77      | false          |
  | RN50__openai                                         | 913          | 2.39                | 30.2       | true           |
  | ViT-B-32__openai                                     | 1004         | 2.26                | 29.84      | true           |
  </details>
  <details><summary>Swahili</summary>
  | Model                           | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |---------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl     | 4248         | 75.44               | 69.51      | true           |
  | nllb-clip-large-siglip__v1      | 4226         | 75.05               | 68.44      | true           |
  | nllb-clip-base-siglip__mrl      | 4696         | 16.95               | 66.09      | true           |
  | nllb-clip-base-siglip__v1       | 4675         | 15.17               | 63.98      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli | 3029         | 6.87                | 21.64      | true           |
  </details>
  <details><summary>Swedish</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 77.12      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 76.37      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 73.41      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 72.83      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 72.51      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 72.2       | false          |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 72.1       | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 72.06      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 71.84      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 71.7       | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 71.7       | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 71.61      | false          |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 71.51      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 71.45      | true           |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 71.23      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 67.48      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 66.93      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 66.37      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 64.86      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 62.35      | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 61.51      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 56.74      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 55.92      | false          |
  | ViT-B-16-SigLIP-512__webli                           | 1828         | 26.17               | 48.5       | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 48.38      | true           |
  | ViT-B-16-SigLIP-256__webli                           | 1102         | 7.11                | 48.06      | false          |
  | ViT-B-16-SigLIP-384__webli                           | 1128         | 13.53               | 47.99      | false          |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 47.93      | false          |
  | ViT-SO400M-14-SigLIP-384__webli                      | 4417         | 72.19               | 29.98      | false          |
  </details>
  <details><summary>Telugu</summary>
  | Model                       | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |-----------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl | 4248         | 75.44               | 64.32      | true           |
  | nllb-clip-large-siglip__v1  | 4226         | 75.05               | 62.34      | true           |
  | nllb-clip-base-siglip__mrl  | 4696         | 16.95               | 60.72      | true           |
  | nllb-clip-base-siglip__v1   | 4675         | 15.17               | 58.8       | true           |
  </details>
  <details><summary>Thai</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 79.99      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 79.07      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 76.13      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 75.23      | true           |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 74.04      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 66.03      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 45.87      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 45.69      | false          |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 45.52      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 44.96      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 44.75      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 44.66      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 43.99      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 43.91      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 43.06      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 41.86      | false          |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 41.1       | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 37.35      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 35.28      | false          |
  </details>
  <details><summary>Turkish</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 81.15      | true           |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 80.89      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 78.11      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 77.51      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 77.36      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 77.28      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 77.24      | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 77.01      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 76.37      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 75.92      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 75.69      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 75.68      | false          |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 75.54      | true           |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 75.16      | true           |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 73.83      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 70.15      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 69.19      | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 66.72      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 64.76      | false          |
  | ViT-H-14-378-quickgelu__dfn5b                        | 5049         | 108.4               | 38.8       | false          |
  | ViT-H-14-quickgelu__dfn5b                            | 4701         | 38.74               | 38.48      | false          |
  | ViT-L-16-SigLIP-384__webli                           | 3396         | 47.6                | 30.83      | false          |
  | ViT-L-16-SigLIP-256__webli                           | 3160         | 23.84               | 30.28      | false          |
  | ViT-L-14-quickgelu__dfn2b                            | 2212         | 20.49               | 21.31      | true           |
  | ViT-B-16-SigLIP__webli                               | 1081         | 5.77                | 20.08      | true           |
  </details>
  <details><summary>Ukrainian</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 83.92      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 83.88      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 83.2       | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 79.99      | true           |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 79.31      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 78.73      | true           |
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 78.33      | true           |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 77.95      | false          |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 77.56      | true           |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 77.49      | true           |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 77.02      | false          |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 76.87      | false          |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 76.31      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 75.91      | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 75.75      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 75.1       | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 73.3       | true           |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 65.28      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 63.95      | false          |
  </details>
  <details><summary>Vietnamese</summary>
  | Model                                                | Memory (MiB) | Execution Time (ms) | Recall (%) | Pareto Optimal |
  |------------------------------------------------------|--------------|---------------------|------------|----------------|
  | ViT-SO400M-16-SigLIP2-384__webli                     | 3854         | 56.57               | 85.86      | true           |
  | ViT-SO400M-14-SigLIP2-378__webli                     | 3940         | 72.25               | 85.73      | false          |
  | ViT-SO400M-16-SigLIP2-512__webli                     | 4050         | 107.67              | 85.67      | false          |
  | ViT-gopt-16-SigLIP2-384__webli                       | 6585         | 146.84              | 85.5       | false          |
  | ViT-L-16-SigLIP2-384__webli                          | 3057         | 51.7                | 84.93      | true           |
  | ViT-SO400M-16-SigLIP2-256__webli                     | 3611         | 27.84               | 84.84      | true           |
  | ViT-L-16-SigLIP2-512__webli                          | 3358         | 92.59               | 84.78      | false          |
  | ViT-SO400M-14-SigLIP2__webli                         | 3622         | 27.63               | 84.34      | true           |
  | ViT-gopt-16-SigLIP2-256__webli                       | 6475         | 64.51               | 84.33      | false          |
  | ViT-L-16-SigLIP2-256__webli                          | 2830         | 23.77               | 83.93      | true           |
  | nllb-clip-large-siglip__mrl                          | 4248         | 75.44               | 83.69      | false          |
  | nllb-clip-large-siglip__v1                           | 4226         | 75.05               | 83.19      | false          |
  | XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k | 4014         | 39.14               | 81.88      | false          |
  | ViT-B-16-SigLIP2__webli                              | 3038         | 5.81                | 80.88      | true           |
  | nllb-clip-base-siglip__mrl                           | 4696         | 16.95               | 79.79      | false          |
  | nllb-clip-base-siglip__v1                            | 4675         | 15.17               | 79.38      | false          |
  | ViT-B-32-SigLIP2-256__webli                          | 3061         | 3.31                | 77.73      | true           |
  | XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k         | 3030         | 3.2                 | 75.18      | true           |
  | ViT-B-16-SigLIP-i18n-256__webli                      | 3029         | 6.87                | 73.05      | true           |
  </details>
</details>

Once you've chosen a model, change this setting to the name of the model you chose. Be sure to re-run Smart Search on all assets after this change.

:::note
Feel free to make a feature request if there's a model you want to use that we don't currently support.
:::

[huggingface-clip]: https://huggingface.co/collections/immich-app/clip-654eaefb077425890874cd07
[huggingface-multilingual-clip]: https://huggingface.co/collections/immich-app/multilingual-clip-654eb08c2382f591eeb8c2a7
