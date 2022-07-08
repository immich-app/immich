"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FilterIterator {
    constructor(source, predicate) {
        this.source = source;
        this.predicate = predicate;
    }
    next() {
        let result;
        // Skip elements until predicate returns true
        do {
            result = this.source.next();
        } while (!result.done && !this.predicate(result.value));
        return result;
    }
}
exports.FilterIterator = FilterIterator;
//# sourceMappingURL=filter.js.map