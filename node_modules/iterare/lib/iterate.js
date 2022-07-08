"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const concat_1 = require("./concat");
const filter_1 = require("./filter");
const flatten_1 = require("./flatten");
const map_1 = require("./map");
const slice_1 = require("./slice");
const utils_1 = require("./utils");
const zip_1 = require("./zip");
class IteratorWithOperators {
    /**
     * @param source Iterator to wrap
     */
    constructor(source) {
        this.source = source;
    }
    /**
     * Returns a `{ value, done }` object that adheres to the Iterator protocol
     */
    next() {
        return this.source.next();
    }
    /**
     * The presence of this method makes the Iterator itself Iterable.
     * This makes it possible to pass it to `for of` and Iterable-accepting functions like `Array.from()`
     */
    [Symbol.iterator]() {
        return this;
    }
    /**
     * Returns a new Iterator by running each element thru iteratee
     */
    map(iteratee) {
        return new IteratorWithOperators(new map_1.MapIterator(this.source, iteratee));
    }
    filter(predicate) {
        return new IteratorWithOperators(new filter_1.FilterIterator(this.source, predicate));
    }
    /**
     * Returns a new Iterator concatenating the Iterator with an additional Iterator or Iterable
     */
    concat(collection) {
        return new IteratorWithOperators(new concat_1.ConcatIterator([this.source, utils_1.toIterator(collection)]));
    }
    /**
     * Returns a new Iterator that emits slice of the source with n elements taken from the beginning
     *
     * @param limit The number of elements to take.
     */
    take(limit) {
        return new IteratorWithOperators(new slice_1.SliceIterator(this.source, 0, limit + 1));
    }
    /**
     * Returns a new Iterator that emits slice of the source with n elements dropped from the beginning
     *
     * @param n The number of elements to drop.
     */
    drop(n) {
        return new IteratorWithOperators(new slice_1.SliceIterator(this.source, n, Infinity));
    }
    /**
     * Returns a new Iterator that emits a slice of the source
     *
     * @param {number} start Zero-based positive start index, inclusive
     * @param {number} end Zero-based positive end index, exclusive, defaults to end of iterator
     */
    slice(start, end = Infinity) {
        return new IteratorWithOperators(new slice_1.SliceIterator(this.source, start, end));
    }
    /**
     * Returns a new Iterator that flattens items emitted by the Iterator a single level deep
     */
    flatten() {
        return new IteratorWithOperators(new flatten_1.FlattenIterator(this.source));
    }
    reduce(iteratee, accumulator) {
        let result;
        if (accumulator === undefined) {
            result = this.source.next();
            if (result.done) {
                throw new TypeError('Reduce of empty Iterator with no initial value');
            }
            accumulator = result.value;
        }
        while (true) {
            result = this.source.next();
            if (result.done) {
                break;
            }
            accumulator = iteratee(accumulator, result.value);
        }
        return accumulator;
    }
    find(predicate) {
        let result;
        while (true) {
            result = this.source.next();
            if (result.done) {
                return undefined;
            }
            if (predicate(result.value)) {
                return result.value;
            }
        }
    }
    /**
     * Iterates and checks if `value` is emitted by the Iterator
     *
     * @param value The value to search
     */
    includes(value) {
        let result;
        do {
            result = this.source.next();
            if (!result.done && result.value === value) {
                return true;
            }
        } while (!result.done);
        return false;
    }
    /**
     * Iterates and checks if `predicate` returns truthy for any element emitted by the Iterator
     */
    some(predicate) {
        let result;
        do {
            result = this.source.next();
            if (!result.done && predicate(result.value)) {
                return true;
            }
        } while (!result.done);
        return false;
    }
    /**
     * Iterates and checks if `predicate` returns truthy for all elements emitted by the Iterator
     */
    every(predicate) {
        let result;
        do {
            result = this.source.next();
            if (!result.done && !predicate(result.value)) {
                return false;
            }
        } while (!result.done);
        return true;
    }
    /**
     * Iterates and invokes `iteratee` for every element emitted by the Iterator
     */
    forEach(iteratee) {
        let result;
        while (true) {
            result = this.source.next();
            if (result.done) {
                break;
            }
            iteratee(result.value);
        }
    }
    /**
     * Iterates and joins all elements emitted by the Iterator together as a string separated by an optional separator
     */
    join(separator = ',') {
        let joined = '';
        let result;
        while (true) {
            result = this.source.next();
            if (result.done) {
                break;
            }
            joined += separator + result.value;
        }
        return joined.substr(separator.length);
    }
    /**
     * Iterates and returns all items emitted by the Iterator as an array.
     * Equivalent to passing the Iterator to `Array.from()`
     */
    toArray() {
        return Array.from(this);
    }
    /**
     * Iterates and returns all items emitted by the Iterator as an ES6 Set.
     * Equivalent to passing the Iterator to `new Set()`
     */
    toSet() {
        const set = new Set();
        while (true) {
            const { value, done } = this.next();
            if (done) {
                return set;
            }
            set.add(value);
        }
    }
    /**
     * Iterates and returns all `[key, value]` paris emitted by the Iterator as an ES6 Map.
     * Equivalent to passing the Iterator to `new Map()`
     */
    toMap() {
        return new Map(this);
    }
}
exports.IteratorWithOperators = IteratorWithOperators;
/**
 * Creates an Iterator with advanced chainable operator methods for any Iterable or Iterator
 */
function iterate(collection) {
    return new IteratorWithOperators(utils_1.toIterator(collection));
}
exports.iterate = iterate;
/**
 * Creates an Iterator that emits pairs of values from the two passed Iterators
 */
function zip(a, b) {
    return new IteratorWithOperators(new zip_1.ZipIterator(utils_1.toIterator(a), utils_1.toIterator(b)));
}
exports.zip = zip;
exports.default = iterate;
//# sourceMappingURL=iterate.js.map