# Open API

Immich uses the [Open API](https://swagger.io/specification/) standard to generate API documentation. To view the published docs see [here](/docs/api).

## Generator

OpenAPI is used to generate the client (Typescript, Dart) SDK. `openapi-generator-cli` can be installed [here](https://openapi-generator.tech/docs/installation/). When you add a new or modify an existing endpoint, you must run the command below to update the client SDK.

```bash
npm run api:generate # Run from the `server/` directory
```

You can find the generated client SDK in the `web/src/api` for Typescript SDK and `mobile/openapi` for Dart SDK.

:::tip
This can also be run via `make api` from the project root directory (not in the `server` folder)
:::
