A command-line interface for interfacing with Immich

# Getting started

    $ ts-node cli/src

To start using the CLI, you need to login with an API key first:

    $ ts-node cli/src login-key https://your-immich-instance/api your-api-key

NOTE: This will store your api key under ~/.config/immich/auth.yml

Next, you can run commands:

    $ ts-node cli/src server-info

When you're done, log out to remove the credentials from your filesystem

    $ ts-node cli/src logout

# Usage

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

# Known issues

- Upload can't use sdk due to multiple issues
