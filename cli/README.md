A command-line interface for interfacing with Immich

# Installing

To use the cli, run

    $ npm install @immich/cli´

# Usage

To use the CLI, you need to login with an API key first:

    $ immich login-key https://your-immich-instance/api your-api-key

NOTE: This will store your api key in cleartext under ~/.config/immich/auth.yml

Next, you can run commands:

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
  import [options] [paths...]       Import existing assets
  server-info                       Display server information
  login-key [instanceUrl] [apiKey]  Login using an API key
  help [command]                    display help for command
```

# Todo

- Sidecar should check both .jpg.xmp and .xmp
- Sidecar check could be case-insensitive
- Create albums
- Use the SDK for all api calls. We currently use raw axos http calls

# For developers

To build the Immich CLI from source, run the following in the cli folder:

    $ npm run build

TODO: document how to run the cli from source

You can then install the CLI globally using

    $ npm install -g .
