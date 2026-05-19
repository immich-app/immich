# Testing

## Server

### Unit tests

Unit are run by calling `pnpm run test` from the `server/` directory.
You need to run `pnpm install` (in `server/`) before _once_.

### End to end tests

The e2e tests can be run by first starting up a test production environment via:

```bash
make e2e
```

Before you can run the tests, you need to run the following commands _once_:

- `pnpm install`
- `pnpm --filter @immich/sdk --filter @immich/cli build`
- `mise //:open-api`

Once the test environment is running, the e2e tests can be run via:

```bash
mise //e2e:test
```

The tests check various things including:

- Authentication and authorization
- Query param, body, and url validation
- Response codes
- Thumbnail generation
- Metadata extraction
- Library scanning
