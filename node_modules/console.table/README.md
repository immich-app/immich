# console.table

> Adds console.table method for convenience

[![NPM][console.table-icon] ][console.table-url]

[![Build status][console.table-ci-image] ][console.table-ci-url]
[![dependencies][console.table-dependencies-image] ][console.table-dependencies-url]
[![devdependencies][console.table-devdependencies-image] ][console.table-devdependencies-url]
[![semantic-release][semantic-image] ][semantic-url]

## Install

```
npm install console.table --save
bower install console.table --save
```

## Use in Node

```
// call once somewhere in the beginning of the app
const cTable = require('console.table');
console.table([
  {
    name: 'foo',
    age: 10
  }, {
    name: 'bar',
    age: 20
  }
]);

// prints
name  age
----  ---
foo   10
bar   20
```

You can pass multiple strings and arrays in a single console.table call.
Each argument will be formatted and printed separately on new line

**Get only table string**
```
const table = cTable.getTable([
  {
    name: 'foo',
    age: 10
  }, {
    name: 'bar',
    age: 20
  }
]);

console.log(table);

// prints
name  age
----  ---
foo   10
bar   20
```

## Use in browser

**INCOMPLETE, PROBABLY CHROME ONLY FOR NOW**

```html
<script src="bower_components/console.table/dist/console.table.js"></script>
<script>
console.table([{name: 'foo'}, {name: 'bar'}]);
</script>
```

## Details

Uses [easy-table](https://www.npmjs.org/package/easy-table) for printing
to console.log

If first argument is a string, and a second argument is an array, prints
title row

```sh
console.table('Several objects', [...]);

Several objects
---------------
name  age
----  ---
foo   10
bar   20
baz   30
```

## Printing array with column names

You can use the given column names when printing an array of arrays. For example,

```sh
var values = [
  ['max', 20],
  ['joe', 30]
];
console.table(['name', 'age'], values);

name  age
----  ---
max   20 
joe   30
```

If the titles is the first item in the array, just use `slice`

```js
var values = [
    ['name', 'age'],
    ['max', 20],
    ['joe', 30]
]
console.table(values[0], values.slice(1));
```

### Small print

Author: Gleb Bahmutov &copy; 2014

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](http://glebbahmutov.com)
* [blog](http://bahmutov.calepin.co/)

License: MIT - do anything with the code, but don't blame me if it does not work.

Spread the word: tweet, star on github, etc.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/console.table/issues) on Github

## MIT License

Copyright (c) 2014 Gleb Bahmutov

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

[console.table-icon]: https://nodei.co/npm/console.table.png?downloads=true
[console.table-url]: https://npmjs.org/package/console.table
[console.table-ci-image]: https://travis-ci.org/bahmutov/console.table.png?branch=master
[console.table-ci-url]: https://travis-ci.org/bahmutov/console.table
[console.table-dependencies-image]: https://david-dm.org/bahmutov/console.table.png
[console.table-dependencies-url]: https://david-dm.org/bahmutov/console.table
[console.table-devdependencies-image]: https://david-dm.org/bahmutov/console.table/dev-status.png
[console.table-devdependencies-url]: https://david-dm.org/bahmutov/console.table#info=devDependencies
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
