import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Smart Search

Immich uses Postgres as its search database for both metadata and smart search.

Smart search is powered by the [pgvecto.rs](https://github.com/tensorchord/pgvecto.rs) extension, utilizing machine learning models like [CLIP](https://openai.com/research/clip) to provide relevant search results. This allows for freeform searches without requiring specific keywords in the image or video metadata.

Archived photos are not included in search results by default. To include them, mark the checkbox in [advanced search filters](/docs/features/smart-search#advanced-search-filters).

:::tip Alternative CLIP Models
More powerful models can be used for more accurate search results. For more information, see the related [FAQ](/docs/FAQ#can-i-use-a-custom-clip-model).
:::

:::info
Smart Search is currently limited to 5,000 results for a single search on the web.
:::

## Advanced Search Filters

In addition, Immich offers advanced search functionality, allowing you to find specific content using customizable search filters. These filters include location, one or more faces, specific albums, and more. You can try out the search filters on the [Demo site](https://demo.immich.app).

Smart search features include:

- Search for one or more faces (with or without context search).
- Search by Country or State or City or by all three.
- Search by camera make and model.
- Search by date range.
- Search by file name.
- Search by media types: image, video or all (**Note:** Image includes live images).
- Search by condition: not in any album or archive or Favorite or all conditions.

<Tabs>
  <TabItem value="Computer" label="Computer" default>

Some search examples:

<img src={require('./img/advanced-search-filters.webp').default} width="70%" title='Advanced search filters' />

<img src={require('./img/search-ex-1.png').default} width="70%" title='Search Example 1' />

</TabItem>
  <TabItem value="Mobile" label="Mobile">

<img src={require('./img/moblie-smart-serach.webp').default} width="30%" title='Smart search on mobile' />

</TabItem>
</Tabs>
