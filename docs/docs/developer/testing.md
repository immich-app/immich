# Testing

## Server

### Unit tests

Unit are run by calling `npm run test` from the `server` directory.

### End to end tests

The e2e tests can be run by first starting up a test production environment via:

```bash
make e2e
```

Once the test environment is running, the e2e tests can be run via:

```bash
cd e2e/
npm test
```

The tests check various things including:

- Authentication and authorization
- Query param, body, and url validation
- Response codes
- Thumbnail generation
- Metadata extraction
- Library scanning
