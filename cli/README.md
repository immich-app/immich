A command-line interface for interfacing with the self-hosted photo manager [Immich](https://immich.app/).

# Installing

To use the cli, run

    $ npm install @immich/cli

# Usage

To use the CLI, you need to login with an API key first:

    $ immich login-key https://your-immich-instance/api your-api-key

NOTE: This will store your api key in cleartext under ~/.config/immich/auth.yml

Next, you can run commands, for example:

    $ immich server-info

When you're done, log out to remove the credentials from your filesystem

    $ immich logout

# Commands

```
Usage: immich [options] [command]

Immich command line interface

Options:
  -h, --help                        display help for command

Commands:
  upload [options] [paths...]       Upload assets
  server-info                       Display server information
  login-key [instanceUrl] [apiKey]  Login using an API key
  logout                            Remove stored credentials
  help [command]                    display help for command
```

# Todo

- Sidecar should check both .jpg.xmp and .xmp
- Sidecar check could be case-insensitive
- Use the SDK for all api calls. We currently use raw axos http calls
- Use list of supported files from server via api

# For developers

To run the Immich CLI from source, run the following in the cli folder:

    $ npm run build
    $ ts-node .

You'll need ts-node, the easiest way to install it is to use npm:

    $ npm i -g ts-node

You can also build and install the CLI using

    $ npm run build
    $ npm install -g .
