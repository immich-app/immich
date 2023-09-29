# Testing

## Server

### Unit tests

Unit are run by calling `npm run test` from the `server` directory.

### End to end tests

There are several levels of end-to-end tests. The most straightforward way is to call `npm run test:e2e` from the `server` directory. This will set up a dummy database inside a temporary container and run the tests against it. Setup and teardown is automatically taken care of. That test, however, can not set up all prerequisites to parse file formats, as that is very complex and error-prone. As such, this test excludes some test cases.

To perform a full e2e test, you need to run e2e tests inside docker. The easiest way to do that is to run `make test-e2e` in the root directory. This will build and start a docker-compose consisting of the server, microservices, and a postgres database. It will then perfom the tests and exit.
