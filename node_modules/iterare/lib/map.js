"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * An iterator that emits results by running each element through a provided predicate
 */
class MapIterator {
    constructor(source, iteratee) {
        this.source = source;
        this.iteratee = iteratee;
    }
    next() {
        const { value, done } = this.source.next();
        return { value: !done && this.iteratee(value), done };
    }
}
exports.MapIterator = MapIterator;
//# sourceMappingURL=map.js.map