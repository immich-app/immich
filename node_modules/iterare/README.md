# iterare

> lat. _to repeat, to iterate_

[![npm](https://img.shields.io/npm/v/iterare.svg)](https://www.npmjs.com/package/iterare)
[![downloads](https://img.shields.io/npm/dt/iterare.svg)](https://www.npmjs.com/package/iterare)
[![build](https://travis-ci.org/felixfbecker/iterare.svg?branch=master)](https://travis-ci.org/felixfbecker/iterare)
[![codecov](https://codecov.io/gh/felixfbecker/iterare/branch/master/graph/badge.svg)](https://codecov.io/gh/felixfbecker/iterare)
[![dependencies](https://david-dm.org/felixfbecker/iterare/status.svg)](https://david-dm.org/felixfbecker/iterare)
![node](http://img.shields.io/node/v/iterare.svg)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![license](https://img.shields.io/npm/l/iterare.svg)](https://github.com/felixfbecker/iterare/blob/master/LICENSE.txt)
[![chat: on gitter](https://badges.gitter.im/felixfbecker/iterare.svg)](https://gitter.im/felixfbecker/iterare?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

ES6 Iterator library for applying multiple transformations to a collection in a single iteration.

## [API Documentation](http://iterare.surge.sh/)

## Motivation

Ever wanted to iterate over ES6 collections like `Map` or `Set` with `Array`-built-ins like `map()`, `filter()`, `reduce()`?
Lets say you have a large `Set` of URIs and want to get a `Set` back that contains file paths from all `file://` URIs.

The loop solution is very clumsy and not very functional:

```javascript
const uris = new Set(['file:///foo.txt', 'http:///npmjs.com', 'file:///bar/baz.txt'])
const paths = new Set()
for (const uri of uris) {
  if (!uri.startsWith('file://')) {
    continue
  }
  const path = uri.substr('file:///'.length)
  paths.add(path)
}
```

Much more readable is converting the `Set` to an array, using its methods and then converting back:

```javascript
new Set(
  Array.from(uris)
    .filter(uri => uri.startsWith('file://'))
    .map(uri => uri.substr('file:///'.length))
)
```

But there is a problem: Instead of iterating once, you iterate 4 times (one time for converting, one time for filtering, one time for mapping, one time for converting back).
For a large Set with thousands of elements, this has significant overhead.

Other libraries like RxJS or plain NodeJS streams would support these kinds of "pipelines" without multiple iterations, but they work only asynchronously.

With this library you can use many methods you know and love from `Array` and lodash while only iterating once - thanks to the ES6 [iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols):

```javascript
import iterate from 'iterare'

iterate(uris)
  .filter(uri => uri.startsWith('file://'))
  .map(uri => uri.substr('file:///'.length))
  .toSet()
```

`iterate` accepts any kind of Iterator or Iterable (arrays, collections, generators, ...) and returns a new Iterator object that can be passed to any Iterable-accepting function (collection constructors, `Array.from()`, `for of`, ...).
Only when you call a method like `toSet()`, `reduce()` or pass it to a `for of` loop will each value get pulled through the pipeline, and only once.

This library is essentially

- RxJS, but fully synchronous
- lodash, but with first-class support for ES6 collections.

## Performance

Benchmarks based on the examples above:

### [`map` + `filter`](https://github.com/felixfbecker/iterare/blob/master/src/benchmarks/map_filter_set.ts)

Simulate iterating over a very lage Set of strings and applying a filter and a map on it.

| Method             |                              ops/sec |
| ------------------ | -----------------------------------: |
| Loop               | 466 ops/sec ±1.31% (84 runs sampled) |
| **iterare**        | 397 ops/sec ±2.01% (81 runs sampled) |
| RxJS               | 339 ops/sec ±0.77% (83 runs sampled) |
| Array method chain | 257 ops/sec ±1.73% (79 runs sampled) |
| Lodash             | 268 ops/sec ±0.84% (81 runs sampled) |
| IxJS (ES6)         | 216 ops/sec ±0.81% (81 runs sampled) |
| IxJS (ES5)         | 141 ops/sec ±0.87% (77 runs sampled) |

### [`filter` + `take`](https://github.com/felixfbecker/iterare/blob/master/src/benchmarks/filter_take_set.ts)

Simulate iterating over a very lage Set of strings and applying a filter on it, then taking only the first 1000 elements.
A smart implementations should only apply the filter predicate to the first 5 elements.

| Method             |                                    ops/sec |
| ------------------ | -----------------------------------------: |
| Loop               | 3,059,466 ops/sec ±0.75% (88 runs sampled) |
| **iterare**        |   963,257 ops/sec ±0.68% (89 runs sampled) |
| IxJS (ES6)         |   424,488 ops/sec ±0.63% (89 runs sampled) |
| RxJS               |   168,853 ops/sec ±2.58% (86 runs sampled) |
| IxJS (ES5)         |   107,961 ops/sec ±1.88% (78 runs sampled) |
| Lodash             |     41.71 ops/sec ±1.15% (54 runs sampled) |
| Array method chain |     24.74 ops/sec ±3.69% (45 runs sampled) |

## Lazy Evaluation

Going a step further, if you only care about a specific number of elements in the end, only these elements will run through the pipeline:

```javascript
iterate(collection)
  .filter(uri => uri.startsWith('file://'))
  .take(5)
```

In this example, the filter predicate is called only until 5 elements have been found.
The alternative with an array would call it for every element in the collection:

```javascript
Array.from(collection)
  .filter(uri => uri.startsWith('file://'))
  .slice(0, 5)
```

## Contributing

The source is written in TypeScript.

- `npm run build` compiles TS
- `npm run watch` compiles on file changes
- `npm test` runs tests
- `node lib/benchmarks/____` runs a benchmark
