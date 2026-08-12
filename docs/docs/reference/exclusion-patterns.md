# Exclusion patterns

:::info
Exclusion patterns are a feature of [external libraries](/concepts/external-libraries). They are set per library on its Scan Settings page and have no effect on assets uploaded to Immich normally.
:::

Exclusion patterns are glob patterns that prevent files from being imported. They are matched against the **full file path**, and a file matching any pattern is not added.

See [External libraries](/concepts/external-libraries#what-a-library-contains) for how patterns fit into scanning, [External Library settings](/reference/system-settings#external-library) for where they are configured, and [Add an external library](/administration/add-an-external-library#step-3---exclude-the-raw-files) for a worked example.

The [Immich CLI](/reference/immich-cli) is separate from external libraries, but its `--ignore` option accepts the same glob syntax documented below.

## Syntax

| Token   | Matches                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------- |
| `*`     | Zero or more characters within a single filename or directory name                                  |
| `**`    | Zero or more directories, recursively. At the end of a pattern it also matches all files beneath it |
| `{a,b}` | Either alternative, e.g. `{tif,jpg}`                                                                |
| `\`     | Escapes the following character, needed for special characters such as `@`                          |

## Examples

| Pattern            | Effect                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `**/*.tif`         | Excludes all files with the extension `.tif`                                                             |
| `**/hidden.jpg`    | Excludes all files named `hidden.jpg`                                                                    |
| `**/Raw/**`        | Excludes all files in any directory named `Raw`                                                          |
| `**/*.{tif,jpg}`   | Excludes all files with the extension `.tif` or `.jpg`                                                   |
| `**/exclude_me/**` | Excludes all files in any directory named `exclude_me`, and all files in its subdirectories, recursively |
| `**/\@eaDir/**`    | Excludes all files in any directory named `@eaDir`                                                       |

## Implementation

Immich processes exclusion patterns with the [glob](https://www.npmjs.com/package/glob) package, and sometimes translates them into [Postgres LIKE patterns](https://www.postgresql.org/docs/current/functions-matching.html).

Because not every glob construct can be reliably translated to the Postgres syntax, only basic folder and extension exclusions are supported; advanced glob usage is not recommended. See the [glob primer](https://github.com/isaacs/node-glob#glob-primer) for an overview of the syntax in general.
