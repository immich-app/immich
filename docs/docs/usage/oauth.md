---
sidebar_position: 5
---

# OAuth Authentication

This page contains details about using OAuth 2 in Immich.

## Overview

Immich supports 3rd party authentication via [OpenID Connect][oidc] (OIDC), an identity layer built on top of OAuth2. OIDC is supported by most identity providers, including:

- [Authentik](https://goauthentik.io/integrations/sources/oauth/#openid-connect)
- [Authelia](https://www.authelia.com/configuration/identity-providers/open-id-connect/)
- [Okta](https://www.okta.com/openid-connect/)
- [Google](https://developers.google.com/identity/openid-connect/openid-connect)

## Prerequisites

Before enabling OAuth in Immich, a new client application needs to be configured in the 3rd-party authentication server. While the specifics of this setup vary from provider to provider, the general approach should be the same.

1. Create a new (Client) Application

   1. The **Provider** type should be `OpenID Connect` or `OAuth2`
   2. The **Client type** should be `Confidential`
   3. The **Application** type should be `Web`
   4. The **Grant** type should be `Authorization Code`

2. Configure Redirect URIs/Origins

   1. The **Sign-in redirect URIs** should include:

      - All URLs that will be used to access the login page of the Immich web client (eg. `http://localhost:2283/auth/login`, `http://192.168.0.200:2283/auth/login`, `https://immich.example.com/auth/login`)

## Enable OAuth

Once you have a new OAuth client application configured, Immich can be configured using the following environment variables:

| Key                 | Type    | Default              | Description                                                               |
| ------------------- | ------- | -------------------- | ------------------------------------------------------------------------- |
| OAUTH_ENABLED       | boolean | false                | Enable/disable OAuth2                                                     |
| OAUTH_ISSUER_URL    | URL     | (required)           | Required. Self-discovery URL for client (from previous step)              |
| OAUTH_CLIENT_ID     | string  | (required)           | Required. Client ID (from previous step)                                  |
| OAUTH_CLIENT_SECRET | string  | (required)           | Required. Client Secret (previous step                                    |
| OAUTH_SCOPE         | string  | openid email profile | Full list of scopes to send with the request (space delimited)            |
| OAUTH_AUTO_REGISTER | boolean | true                 | When true, will automatically register a user the first time they sign in |
| OAUTH_BUTTON_TEXT   | string  | Login with OAuth     | Text for the OAuth button on the web                                      |

:::info
The Issuer URL should look something like the following, and return a valid json document.

- `https://accounts.google.com/.well-known/openid-configuration`
- `http://localhost:9000/application/o/immich/.well-known/openid-configuration`

The `.well-known/openid-configuration` part of the url is optional and will be automatically added during discovery.
:::

Here is an example of a valid configuration for setting up Immich to use OAuth with Authentik:

```
OAUTH_ENABLED=true
OAUTH_ISSUER_URL=http://192.168.0.187:9000/application/o/immich
OAUTH_CLIENT_ID=f08f9c5b4f77dcfd3916b1c032336b5544a7b368
OAUTH_CLIENT_SECRET=6fe2e697644da6ff6aef73387a457d819018189086fa54b151a6067fbb884e75f7e5c90be16d3c688cf902c6974817a85eab93007d76675041eaead8c39cf5a2
OAUTH_BUTTON_TEXT=Login with Authentik
```

[oidc]: https://openid.net/connect/
