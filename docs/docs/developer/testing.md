# Testing

## Server

### Unit tests

Unit are run by calling `npm run test` from the `server` directory.

### End to end tests

The backend has an end-to-end test suite that can be called with `npm run test:e2e` from the `server` directory. This will set up a dummy database inside a temporary container and run the tests against it. Setup and teardown is automatically taken care of. That test, however, can not set up all prerequisites to parse file formats, as that is very complex and error-prone. As such, this test excludes some test cases like HEIC file imports. The test suite will also print a friendly warning to remind you that not all tests are being run.

Note that there is a bug in nodejs \<20.8 that causes segmentation faults when running these tests. If you run into segfaults, ensure you are using at least version 20.8.

To perform a full e2e test, you need to run e2e tests inside docker. The easiest way to do that is to run `make test-e2e` in the root directory. This will build and start a docker-compose consisting of the server, microservices, and a postgres database. It will then perform the tests and exit.

If you manually install the dependencies (see the DOCKERFILE) on your development machine, you can also run the full e2e tests manually by setting the `IMMICH_RUN_ALL_TESTS` environment value to true, i.e. `IMMICH_RUN_ALL_TESTS=true npm run e2e:jobs`.
