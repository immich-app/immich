"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SliceIterator {
    /**
     * @param {Iterator<T>} source Source Iterator
     * @param {number} start Zero-based positive start index, inclusive
     * @param {number} end Zero-based positive end index, exclusive, defaults to end of iterator
     */
    constructor(source, start, end = Infinity) {
        this.source = source;
        this.start = start;
        this.end = end;
        this.i = 0;
    }
    next() {
        // Skip elements before start
        while (this.i < this.start) {
            const result = this.source.next();
            if (result.done) {
                return result;
            }
            this.i++;
        }
        // Finish when end is reached
        this.i++;
        if (this.i >= this.end) {
            return { done: true };
        }
        return this.source.next();
    }
}
exports.SliceIterator = SliceIterator;
//# sourceMappingURL=slice.js.map