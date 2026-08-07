# OAuth settings

The settings below are configured on the web at `Administration > Settings > Authentication`. For the steps to register a client application with a provider and turn OAuth on, see [Set up OAuth authentication](/administration/set-up-oauth-authentication).

| Setting                                                                                         | Type    | Default              | Description                                                                         |
| ----------------------------------------------------------------------------------------------- | ------- | -------------------- | ----------------------------------------------------------------------------------- |
| Enabled                                                                                         | boolean | false                | Enable/disable OAuth                                                                |
| `issuer_url`                                                                                    | URL     | (required)           | Required. Self-discovery URL for client (from previous step)                        |
| `client_id`                                                                                     | string  | (required)           | Required. Client ID (from previous step)                                            |
| `client_secret`                                                                                 | string  | (required)           | Required. Client Secret (previous step)                                             |
| `scope`                                                                                         | string  | openid email profile | Full list of scopes to send with the request (space delimited)                      |
| `id_token_signed_response_alg`                                                                  | string  | RS256                | The algorithm used to sign the id token (examples: RS256, HS256)                    |
| `userinfo_signed_response_alg`                                                                  | string  | none                 | The algorithm used to sign the userinfo response (examples: RS256, HS256)           |
| `prompt`                                                                                        | string  | (empty)              | Prompt parameter for authorization url (examples: select_account, login, consent)   |
| `end_session_endpoint`                                                                          | URL     | (empty)              | Http(s) alternative end session endpoint (logout URI)                               |
| Request timeout                                                                                 | string  | 30,000 (30 seconds)  | Number of milliseconds to wait for http requests to complete before giving up       |
| Storage Label Claim                                                                             | string  | preferred_username   | Claim mapping for the user's storage label**¹**                                     |
| Role Claim                                                                                      | string  | immich_role          | Claim mapping for the user's role. (should return "user" or "admin")**¹**           |
| Storage Quota Claim                                                                             | string  | immich_quota         | Claim mapping for the user's storage**¹**                                           |
| Default Storage Quota (GiB)                                                                     | number  | 0                    | Default quota for user without storage quota claim (empty for unlimited quota)      |
| Button Text                                                                                     | string  | Login with OAuth     | Text for the OAuth button on the web                                                |
| Auto Register                                                                                   | boolean | true                 | When true, will automatically register a user the first time they sign in           |
| [Auto Launch](/administration/set-up-oauth-authentication#auto-launch)                          | boolean | false                | When true, will skip the login page and automatically start the OAuth login process |
| [Mobile Redirect URI Override](/administration/set-up-oauth-authentication#mobile-redirect-uri) | URL     | (empty)              | Http(s) alternative mobile redirect URI                                             |

:::note Claim Options [1]

Claim is only used on user creation and not synchronized after that.

:::

:::note Claim options [1]
Claims are only used on user creation and are not synchronized after that.
:::

The Issuer URL should return a valid JSON document, for example:

- `https://accounts.google.com/.well-known/openid-configuration`
- `http://localhost:9000/application/o/immich/.well-known/openid-configuration`

The `.well-known/openid-configuration` part of the URL is optional and is added automatically during discovery.
