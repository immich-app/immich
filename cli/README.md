A command-line interface for interfacing with the self-hosted photo manager [Immich](https://immich.app/).

Please see the [Immich CLI documentation](https://immich.app/docs/features/command-line-interface).

# For developers

Before building the CLI, you must build the immich server and the open-api client. To build the server run the following in the server folder:

    $ npm install
    $ npm run build

Then, to build the open-api client run the following in the open-api folder:

    $ ./bin/generate-open-api.sh

To run the Immich CLI from source, run the following in the cli folder:

    $ npm install
    $ npm run build
    $ ts-node .

You'll need ts-node, the easiest way to install it is to use npm:

    $ npm i -g ts-node

You can also build and install the CLI using

    $ npm run build
    $ npm install -g .
****
