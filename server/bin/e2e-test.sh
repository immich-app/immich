#!/usr/bin/env bash

# We need node version at least 20.8 nightly for the e2e tests due to a bug that causes segfaults
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
. ~/.nvm/nvm.sh
nvm install v20.8
nvm use 20.8

npm run test:e2e