# Smart Search

Immich uses Postgres as its search database for both metadata and smart search.

Smart search is powered by the [pgvecto.rs v0.2.0](https://github.com/tensorchord/pgvecto.rs) extension, utilizing machine learning models like [CLIP](https://openai.com/research/clip) to provide relevant search results. This allows for freeform searches without requiring specific keywords in the image or video metadata.

Metadata search (prefixed with `m:`) can search specifically by text without the use of a model.

Archived photos are not included in search results by default. To include them, add checkbox in advanced search filters.

Some search examples:

<img src={require('./img/search-ex-3.webp').default} title='Search Example 2' />

## Advanced search filters

In addition, Immich offers advanced search functionality, allowing you to find specific content using customizable search filters. These filters include location, one or more faces, specific albums, and more. You can try out the search filters on the [Demo site](https://demo.immich.app).

<img src={require('./img/advanced-search-filters.webp').default} title='advanced search filters' />
