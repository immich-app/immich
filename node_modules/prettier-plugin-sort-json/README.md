# prettier-plugin-sort-json

A plugin for [Prettier](https://prettier.io) that sorts JSON files by property name.

## Description

This plugin adds a JSON preprocessor that will sort JSON files alphanumerically by key.

By default, top-level object entries are sorted by key lexically using [`Array.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort), according to each character's Unicode code point value. It can be [configured](#configuration) to sort recursively, and with a custom sort order.

### Example

Before:

```json
{
  "z": null,
  "a": null,
  "0": null,
  "exampleNestedObject": {
    "z": null,
    "a": null
  }
}
```

After:

```json
{
  "0": null,
  "a": null,
  "exampleNestedObject": {
    "z": null,
    "a": null
  },
  "z": null
}
```

### Exceptions

- Non-objects

  This is meant to sort objects. JSON files with a top-level value that is not an object are skipped.

- JSON files with dedicated Prettier parsers

  This will not sort `package.json`, `package-lock.json`, or `composer.json`. This plugin only affects the `json` parser used by Prettier. Prettier uses an alternate parser (`json-stringify`) for those three specific files ([See here for details](https://github.com/prettier/prettier/blob/9a8b579d368db99394ab9da114cc37ba772fc887/src/language-js/index.js#L80)).

- JSON embedded in other files

  This will not sort JSON objects within other types of files, such as JavaScript or TypeScript files. This is just for sorting JSON files.

## Requirements

This module requires an [LTS](https://github.com/nodejs/Release) Node version (v16.0.0+), and `prettier` v3+.

We are maintaining support for Prettier v2 on version 2 of this plugin. See [the main-v2 branch](https://github.com/Gudahtt/prettier-plugin-sort-json/tree/main-v2) for instructions on using v2 of this plugin.

## Install

Using `npm`:

```console
npm install --save-dev prettier-plugin-sort-json
```

Using `pnpm`:

```console
pnpm add --save-dev prettier-plugin-sort-json
```

Using `yarn`:

```console
yarn add --dev prettier-plugin-sort-json
```

Then [follow these instructions](https://prettier.io/docs/en/plugins#using-plugins) to load the plugin.

There are some additional configuration options available ([described below](#configuration)), but they are all optional.

### Example Prettier configuration

```json
{
  "plugins": ["prettier-plugin-sort-json"]
}
```

## Configuration

These configuration options are all optional. Each option can be set as a CLI flag, or as an entry in your Prettier configuraton (e.g. in your `.prettierrc` file).

Here are example Prettier configuration files with all default options set:

- `.prettierrc.json`:

  ```json
  {
    "plugins": ["prettier-plugin-sort-json"],
    "jsonRecursiveSort": false,
    "jsonSortOrder": "{\"/.*/\": \"lexical\"}"
  }
  ```

- `.prettierrc.js`:

  ```javascript
  module.exports = {
    plugins: ['prettier-plugin-sort-json'],
    jsonRecursiveSort: false,
    jsonSortOrder: JSON.stringify({ [/.*/]: 'lexical' }),
  };
  ```

### JSON Recursive Sort

Sort JSON objects recursively, including all nested objects. This also sorts objects within JSON arrays.

| Default | CLI                     | Configuration               |
| ------- | ----------------------- | --------------------------- |
| `false` | `--json-recursive-sort` | `jsonRecursiveSort: <bool>` |

### JSON Sort Order

Use a custom sort order. This is specified as a JSON string containing a set of sorting rules.

| Default | CLI                            | Configuration             |
| ------- | ------------------------------ | ------------------------- |
| `""`    | `--json-sort-order '<string>'` | `jsonSortOrder: <string>` |

This JSON string is an _ordered_ set of sorting rules. Each entry is one sorting rule, where they key of the sorting rule defines a _group_ of keys in the object being sorted, and the value of the sorting rule defines the sorting algorithm to use _within_ that group of keys. That is, a rule is structured like this: `[definition of sorting group]: [sorting algorithm within that group]`

Each sorting group is defined either by an exact string, or by a regular expression. For example, the group `A` would include just the key `A`, and the group `/.*/` would include all keys.

> [!NOTE]
> Regular expression sorting groups **must** start with `/` and end with `/`, optionally followed by any supported regular expression flag (supported flags are `i`, `m`, `s`, and `u`, see [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#advanced_searching_with_flags) for details on how they work).

The order of the rules determines the order of the groups; for example, keys in the first group are first, those in the second group come next, etc. Keys that would qualify for multiple sorting groups are always placed in the first. Keys that are not in any sorting group are treated as being in an implied last group, with the default `lexical` sorting algorithm.

#### Example

Here is an example of a custom sort order string:

```yaml
'{ "placeThisFirst": null, "/^\\\\d+/": "numeric", "/.*/": "caseInsensitiveLexical" }'
```

This string has three rules. Here is what they each mean:

1. `"placeThisFirst": null`

   The group is `placeThisFirst`, which is not a regular expression (no leading or trailing forward slash), so it's interpreted as an exact string. This is the first rule, so the key `placeThisFirst` will be first in the sort order.

   No sorting algorithm is specified in this rule (the value is `null`) so the default `lexical` sort _would_ be used to sort keys in this group. Except in this case the sorting algorithm is irrelevant because only one key can be in this group.

2. `"/^\\\\d+/": "numeric"`

   The group in this case is a regular expression that matches keys that start with a number. This is the second rule, so keys starting with a number will come second after `placeThisFirst`.

   The regular expression is double-escaped because it's a string within a stringified JSON object; the real regular expression this represents is `/^\d+/` (see [Escaping](#escaping) for more details).

   The sorting algorithm is `numeric`, so these keys will be sorted numerically (in ascending order).

3. `"/.*/": "caseInsensitiveLexical"`

   The group `/.*/` matches all other keys. These keys will be sorted third, after `placeThisFirst` and after keys starting with a number.

   The sorting algorithm here is `caseInsensitiveLexical`, so keys in this group will be sorted lexically ignoring case.

Here are some example JSON objects that would match these rules, with inline comments to explain:

<details>
<summary>Example Sorted JSON file #1:</summary>

```jsonc
{
  // `placeThisFirst` is the first sorting rule, so this always comes first.
  "placeThisFirst": null,

  // These match the second sorting rule.
  // These keys start with a number, so they're sorted numerically (ascending).
  "1": null,
  // The `numeric` sort order only looks at the numeric prefix.
  // The rest of the key is ignored.
  "2_____irrelevant_text": null,
  "10": null,

  // Everything is matched by the third sorting rule.
  "a": null,
  // This is in the middle because we're using `caseInsensitiveLexical`,
  // rather than the default `lexical` sort order.
  "B": null,
  "c": null,
}
```

</details>

<br>

<details>
<summary> Example Sorted JSON File #2: </summary>

This example only has keys that match the second sorting rule.

```jsonc
{
  // The keys are sorted in ascending order.
  // Values are ignored by all sorting rules. Only keys are sorted.
  "1": 10,
  "2": 9,
  "3": 8,
}
```

</details>

#### Sorting Algorithms

Each `jsonSortOrder` _value_ represents the sorting algorithm to use _within_ that category. If the value is `null`, the default sorting algorithm `lexical` is used. Here are the supported sorting algorithms:

| Sorting Algorithm               | Description                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `lexical`                       | Sort lexically (i.e. lexicographically). This is the default.                                               |
| `numeric`                       | For keys that are prefixed with a number, sort by that number in ascending order. Otherwise sort lexically. |
| `reverseLexical`                | Reverse-order lexical sort.                                                                                 |
| `reverseNumeric`                | Reverse-order numeric sort.                                                                                 |
| `caseInsensitiveLexical`        | Case-insensitive lexical sort.                                                                              |
| `caseInsensitiveNumeric`        | Case-insensitive numeric sort.                                                                              |
| `caseInsensitiveReverseLexical` | Case-insensitive reverse-order lexical sort.                                                                |
| `caseInsensitiveReverseNumeric` | Case-insensitive reverse-order numeric sort.                                                                |
| `none`                          | Do not sort.                                                                                                |

#### Escaping

A stringified JSON object is a strange configuration format. This format was chosen to work around a limitation of Prettier plugins; object configuration values for plugins are not supported, but strings are, so we put an object in a string. This has downsides though, especially if the string includes special characters.

Special characters (such as backslashes) in string literals need to be escaped by a backslash. This is commonplace in string representations of regular expressions, which often include the backslash special character. For example, try running `/^\d+/.toString()` in a console, and you'll see it prints out `"/^\\d+/"`.

When this string is included as the key of a stringified JSON object, all double-quotes and backslashes need to be escaped _again_. That's why a single backslash needed to be represented by _four_ backslashes in the earlier example. If this string is used in a JSON file (e.g. in `package.json` or `.prettierrc.json`) it gets even worse because the string itself needs to use double-quotes, requiring even more escaping of all double-quotes used inside the string:

```yaml
"{ \"placeThisFirst\": null, \"/\\\\d+/\": \"numeric\", \"/.+/\": \"caseInsensitiveLexical\" }"
```

If you're using a JavaScript Prettier configuration file, all of this escaping can be avoided by using `JSON.stringify` to create the `jsonSortOrder` string from an object with RegExp literal keys. For example, you could create the earlier example JSON sort order string like this:

```javascript
{
    jsonSortOrder: JSON.stringify({
      placeThisFirst: null,
      [/^\d+/]: 'numeric',
      [/.*/]: 'caseInsensitiveLexical',
    }),
}
```

This makes the configuration much easier to read and write. This approach is strongly recommended, if the configuration format you're using allows it.

## Ignoring files

This plugin can be used on specific files using [Prettier configuration overrides](https://prettier.io/docs/en/configuration#configuration-overrides). By configuring this plugin in an override, you can control which files it is applied to. Overrides can also allow using different configuration for different files (e.g. different sort order)

For example, lets say you had the following requirements:

- No sorting of JSON by default
- Shallow (non-recursive) sort JSON in the `json/` directory
- Do not sort the file `json/unsorted.json`
- Recursively sort `recursively-sorted.json`

You could do that with this `.prettierrc.json` file:

```json
{
  "overrides": [
    {
      "excludeFiles": ["./json/unsorted.json"],
      "files": ["./json/**"],
      "options": {
        "plugins": ["prettier-plugin-sort-json"]
      }
    },
    {
      "files": ["./json/recursive-sorted.json"],
      "options": {
        "jsonRecursiveSort": true
      }
    }
  ]
}
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
