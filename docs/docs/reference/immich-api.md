# Immich API

Immich exposes a REST API that the web app, mobile app, and [CLI](/reference/immich-cli) all use. Anything those clients can do can be done through the API.

The API is described with the [OpenAPI](https://swagger.io/specification/) standard. The published, browsable documentation lives at [api.immich.app](https://api.immich.app/).

Requests are authenticated with an API key, which is created per user under Account Settings and can be scoped to specific permissions. See [Manage your user settings](/user-guide/manage-your-user-settings).

For generated client SDKs and how the specification is produced, see [OpenAPI](/developer/open-api).
