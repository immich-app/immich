"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isIterator(candidate) {
    return typeof candidate === 'object' && candidate !== null && typeof candidate.next === 'function';
}
exports.isIterator = isIterator;
function isIterable(candidate) {
    return typeof candidate === 'object' && candidate !== null && typeof candidate[Symbol.iterator] === 'function';
}
exports.isIterable = isIterable;
function toIterator(collection) {
    if (isIterator(collection)) {
        return collection;
    }
    if (isIterable(collection)) {
        return collection[Symbol.iterator]();
    }
    throw new Error('Passed collection is neither an Iterator nor an Iterable');
}
exports.toIterator = toIterator;
//# sourceMappingURL=utils.js.map