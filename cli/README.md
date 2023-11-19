A command-line interface for interfacing with the self-hosted photo manager [Immich](https://immich.app/).

Please see the [Immich CLI documentation](https://immich.app/docs/features/command-line-interface).

# For developers

To run the Immich CLI from source, run the following in the cli folder:

    $ npm run build
    $ ts-node .

You'll need ts-node, the easiest way to install it is to use npm:

    $ npm i -g ts-node

You can also build and install the CLI using

    $ npm run build
    $ npm install -g .
