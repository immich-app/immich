# Search

Immich uses Postgres as its search database for both metadata and smart search.

Smart search is powered by the [pgvecto.rs](https://github.com/tensorchord/pgvecto.rs) extension, utilizing machine learning models like CLIP to provide relevant search results. This allows for freeform searches without requiring specific keywords in the image or video metadata.

Metadata search (prefixed with `m:`) can search specifically by text without the use of a model.

Archived photos are not included in search results by default. To include them, add the query parameter `withArchived=true` to the url.

Some search examples:
<img src={require('./img/search-ex-2.webp').default} title='Search Example 1' />

<img src={require('./img/search-ex-3.webp').default} title='Search Example 2' />
