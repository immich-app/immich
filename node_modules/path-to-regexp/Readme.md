# Path-to-RegExp

> Turn a path string such as `/user/:name` into a regular expression.

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

## Installation

```
npm install path-to-regexp --save
```

## Usage

```javascript
const pathToRegexp = require('path-to-regexp')

// pathToRegexp(path, keys?, options?)
// pathToRegexp.match(path)
// pathToRegexp.parse(path)
// pathToRegexp.compile(path)
```

- **path** A string, array of strings, or a regular expression.
- **keys** An array to populate with keys found in the path.
- **options**
  - **sensitive** When `true` the regexp will be case sensitive. (default: `false`)
  - **strict** When `true` the regexp allows an optional trailing delimiter to match. (default: `false`)
  - **end** When `true` the regexp will match to the end of the string. (default: `true`)
  - **start** When `true` the regexp will match from the beginning of the string. (default: `true`)
  - **delimiter** The default delimiter for segments. (default: `'/'`)
  - **endsWith** Optional character, or list of characters, to treat as "end" characters.
  - **whitelist** List of characters to consider delimiters when parsing. (default: `undefined`, any character)

```javascript
const keys = []
const regexp = pathToRegexp('/foo/:bar', keys)
// regexp = /^\/foo\/([^\/]+?)\/?$/i
// keys = [{ name: 'bar', prefix: '/', delimiter: '/', optional: false, repeat: false, pattern: '[^\\/]+?' }]
```

**Please note:** The `RegExp` returned by `path-to-regexp` is intended for ordered data (e.g. pathnames, hostnames). It can not handle arbitrarily ordered data (e.g. query strings, URL fragments, JSON, etc).

### Parameters

The path argument is used to define parameters and populate the list of keys.

#### Named Parameters

Named parameters are defined by prefixing a colon to the parameter name (`:foo`). By default, the parameter will match until the next prefix (e.g. `[^/]+`).

```js
const regexp = pathToRegexp('/:foo/:bar')
// keys = [{ name: 'foo', prefix: '/', ... }, { name: 'bar', prefix: '/', ... }]

regexp.exec('/test/route')
//=> [ '/test/route', 'test', 'route', index: 0, input: '/test/route', groups: undefined ]
```

**Please note:** Parameter names must use "word characters" (`[A-Za-z0-9_]`).

#### Parameter Modifiers

##### Optional

Parameters can be suffixed with a question mark (`?`) to make the parameter optional.

```js
const regexp = pathToRegexp('/:foo/:bar?')
// keys = [{ name: 'foo', ... }, { name: 'bar', delimiter: '/', optional: true, repeat: false }]

regexp.exec('/test')
//=> [ '/test', 'test', undefined, index: 0, input: '/test', groups: undefined ]

regexp.exec('/test/route')
//=> [ '/test/route', 'test', 'route', index: 0, input: '/test/route', groups: undefined ]
```

**Tip:** The prefix is also optional, escape the prefix `\/` to make it required.

##### Zero or more

Parameters can be suffixed with an asterisk (`*`) to denote a zero or more parameter matches. The prefix is used for each match.

```js
const regexp = pathToRegexp('/:foo*')
// keys = [{ name: 'foo', delimiter: '/', optional: true, repeat: true }]

regexp.exec('/')
//=> [ '/', undefined, index: 0, input: '/', groups: undefined ]

regexp.exec('/bar/baz')
//=> [ '/bar/baz', 'bar/baz', index: 0, input: '/bar/baz', groups: undefined ]
```

##### One or more

Parameters can be suffixed with a plus sign (`+`) to denote a one or more parameter matches. The prefix is used for each match.

```js
const regexp = pathToRegexp('/:foo+')
// keys = [{ name: 'foo', delimiter: '/', optional: false, repeat: true }]

regexp.exec('/')
//=> null

regexp.exec('/bar/baz')
//=> [ '/bar/baz','bar/baz', index: 0, input: '/bar/baz', groups: undefined ]
```

#### Unnamed Parameters

It is possible to write an unnamed parameter that only consists of a matching group. It works the same as a named parameter, except it will be numerically indexed.

```js
const regexp = pathToRegexp('/:foo/(.*)')
// keys = [{ name: 'foo', ... }, { name: 0, ... }]

regexp.exec('/test/route')
//=> [ '/test/route', 'test', 'route', index: 0, input: '/test/route', groups: undefined ]
```

#### Custom Matching Parameters

All parameters can have a custom regexp, which overrides the default match (`[^/]+`). For example, you can match digits or names in a path:

```js
const regexpNumbers = pathToRegexp('/icon-:foo(\\d+).png')
// keys = [{ name: 'foo', ... }]

regexpNumbers.exec('/icon-123.png')
//=> ['/icon-123.png', '123']

regexpNumbers.exec('/icon-abc.png')
//=> null

const regexpWord = pathToRegexp('/(user|u)')
// keys = [{ name: 0, ... }]

regexpWord.exec('/u')
//=> ['/u', 'u']

regexpWord.exec('/users')
//=> null
```

**Tip:** Backslashes need to be escaped with another backslash in JavaScript strings.

### Match

The `match` function will return a function for transforming paths into parameters:

```js
const match = pathToRegexp.match('/user/:id')

match('/user/123') //=> { path: '/user/123', index: 0, params: { id: '123' } }
match('/invalid') //=> false
```

### Parse

The `parse` function will return a list of strings and keys from a path string:

```js
const tokens = pathToRegexp.parse('/route/:foo/(.*)')

console.log(tokens[0])
//=> "/route"

console.log(tokens[1])
//=> { name: 'foo', prefix: '/', delimiter: '/', optional: false, repeat: false, pattern: '[^\\/]+?' }

console.log(tokens[2])
//=> { name: 0, prefix: '/', delimiter: '/', optional: false, repeat: false, pattern: '.*' }
```

**Note:** This method only works with strings.

### Compile ("Reverse" Path-To-RegExp)

The `compile` function will return a function for transforming parameters into a valid path:

```js
const toPath = pathToRegexp.compile('/user/:id')

toPath({ id: 123 }) //=> "/user/123"
toPath({ id: 'café' }) //=> "/user/caf%C3%A9"
toPath({ id: '/' }) //=> "/user/%2F"

toPath({ id: ':/' }) //=> "/user/%3A%2F"
toPath({ id: ':/' }, { encode: (value, token) => value, validate: false }) //=> "/user/:/"

const toPathRepeated = pathToRegexp.compile('/:segment+')

toPathRepeated({ segment: 'foo' }) //=> "/foo"
toPathRepeated({ segment: ['a', 'b', 'c'] }) //=> "/a/b/c"

const toPathRegexp = pathToRegexp.compile('/user/:id(\\d+)')

toPathRegexp({ id: 123 }) //=> "/user/123"
toPathRegexp({ id: '123' }) //=> "/user/123"
toPathRegexp({ id: 'abc' }) //=> Throws `TypeError`.
toPathRegexp({ id: 'abc' }, { validate: false }) //=> "/user/abc"
```

**Note:** The generated function will throw on invalid input. It will do all necessary checks to ensure the generated path is valid. This method only works with strings.

### Working with Tokens

Path-To-RegExp exposes the two functions used internally that accept an array of tokens.

* `pathToRegexp.tokensToRegExp(tokens, keys?, options?)` Transform an array of tokens into a matching regular expression.
* `pathToRegexp.tokensToFunction(tokens)` Transform an array of tokens into a path generator function.

#### Token Information

* `name` The name of the token (`string` for named or `number` for index)
* `prefix` The prefix character for the segment (e.g. `/`)
* `delimiter` The delimiter for the segment (same as prefix or default delimiter)
* `optional` Indicates the token is optional (`boolean`)
* `repeat` Indicates the token is repeated (`boolean`)
* `pattern` The RegExp used to match this token (`string`)

## Compatibility with Express <= 4.x

Path-To-RegExp breaks compatibility with Express <= `4.x`:

* RegExp special characters can only be used in a parameter
  * Express.js 4.x used all `RegExp` special characters regardless of position - this considered a bug
* Parameters have suffixes that augment meaning - `*`, `+` and `?`. E.g. `/:user*`
* No wildcard asterisk (`*`) - use parameters instead (`(.*)`)

## TypeScript

Includes a [`.d.ts`](index.d.ts) file for TypeScript users.

## Live Demo

You can see a live demo of this library in use at [express-route-tester](http://forbeslindesay.github.com/express-route-tester/).

## License

MIT

[npm-image]: https://img.shields.io/npm/v/path-to-regexp.svg?style=flat
[npm-url]: https://npmjs.org/package/path-to-regexp
[travis-image]: https://img.shields.io/travis/pillarjs/path-to-regexp.svg?style=flat
[travis-url]: https://travis-ci.org/pillarjs/path-to-regexp
[coveralls-image]: https://img.shields.io/coveralls/pillarjs/path-to-regexp.svg?style=flat
[coveralls-url]: https://coveralls.io/r/pillarjs/path-to-regexp?branch=master
[david-image]: http://img.shields.io/david/pillarjs/path-to-regexp.svg?style=flat
[david-url]: https://david-dm.org/pillarjs/path-to-regexp
[license-image]: http://img.shields.io/npm/l/path-to-regexp.svg?style=flat
[license-url]: LICENSE.md
[downloads-image]: http://img.shields.io/npm/dm/path-to-regexp.svg?style=flat
[downloads-url]: https://npmjs.org/package/path-to-regexp
