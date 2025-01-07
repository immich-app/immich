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

### CLIP model

More powerful models can be used for more accurate search results, but are slower and can require more server resources. Check out the models [here][huggingface-clip] for more options!

[Multilingual models][huggingface-multilingual-clip] are also available so users can search in their native language. These models support over 100 languages; the `nllb` models in particular support 200.
:::note
Multilingual models are much slower and larger and perform slightly worse for English than English-only models. For this reason, only use them if you actually intend to search in a language besides English.

As a special case, the `ViT-H-14-quickgelu__dfn5b` and `ViT-H-14-378-quickgelu__dfn5b` models are excellent at many European languages despite not specifically being multilingual. They're very intensive regardless, however - especially the latter.
:::

Once you've chosen a model, change this setting to the name of the model you chose. Be sure to re-run Smart Search on all assets after this change.

:::note
Feel free to make a feature request if there's a model you want to use that we don't currently support.
:::

[huggingface-clip]: https://huggingface.co/collections/immich-app/clip-654eaefb077425890874cd07
[huggingface-multilingual-clip]: https://huggingface.co/collections/immich-app/multilingual-clip-654eb08c2382f591eeb8c2a7
