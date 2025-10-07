A command-line interface for interfacing with the self-hosted photo manager [Immich](https://immich.app/).

Please see the [Immich CLI documentation](https://docs.immich.app/features/command-line-interface).

# For developers

Before building the CLI, you must build the immich server and the open-api client. To build the server run the following in the server folder:

    $ pnpm install
    $ pnpm run build

Then, to build the open-api client run the following in the open-api folder:

    $ ./bin/generate-open-api.sh

## Run from source

You'll need tsx, the easiest way to install it is to use pnpm:

    $ pnpm i -g tsx

To run the Immich CLI from source, run the following in the cli folder:
    $ pnpm install
    $ tsx .

## Debug from source (VSCode)

With VScode you can debug the Immich CLI. Go to the launch.json file, find the Immich CLI config and change this with the command you need to debug

`"args": ["upload", "--help"],`

replace that for the command of your choice.

## Run from build

You can also build and install the CLI using

    $ pnpm run build
    $ pnpm install -g .
****
