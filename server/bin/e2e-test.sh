#!/usr/bin/env bash

# We need node version 21 nightly for the e2e tests due to a bug that causes segfaults. Whenever this fix is merged into a stable release, we can remove this script.
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
. ~/.nvm/nvm.sh
NVM_NODEJS_ORG_MIRROR=https://nodejs.org/download/nightly/ nvm install v21.0.0-nightly20230921480ab8c3a4 && nvm use 21

git clone https://github.com/immich-app/test-assets server/test/assets

npm run test:e2e-docker