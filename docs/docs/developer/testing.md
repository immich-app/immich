# Testing

## Server

### Unit tests

Unit are run by calling `npm run test` from the `server` directory.

### End to end tests

The backend has two end-to-end test suites that can be called with the following two commands from the project root directory:

- `make server-e2e-api`
- `make server-e2e-jobs`

#### API (e2e)

The API e2e tests spin up a test database and execute http requests against the server, validating the expected response codes and functionality for API endpoints.

#### Jobs (e2e)

The Jobs e2e tests spin up a docker test environment where thumbnail generation, library scanning, and other _job_ workflows are validated.
