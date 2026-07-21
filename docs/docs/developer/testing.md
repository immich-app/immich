# Testing

## Server

### Unit tests

Unit tests are run with `mise //server:test`.
You need to run `mise //server:install` before _once_.

### End to end tests

The e2e tests can be run by first starting up a test production environment via:

```bash
mise e2e
```

Before you can run the tests, you need to run the following commands _once_:

- `mise //e2e:ci-setup` (installs e2e, SDK, and CLI dependencies)
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
