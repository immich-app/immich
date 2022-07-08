"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConcatIterator {
    constructor(toConcat) {
        this.toConcat = toConcat;
    }
    next() {
        if (this.toConcat.length === 0) {
            return { done: true };
        }
        const result = this.toConcat[0].next();
        if (!result.done) {
            return result;
        }
        this.toConcat.shift();
        return this.next();
    }
}
exports.ConcatIterator = ConcatIterator;
//# sourceMappingURL=concat.js.map