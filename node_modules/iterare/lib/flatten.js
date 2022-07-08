"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
class FlattenIterator {
    constructor(outer) {
        this.outer = outer;
    }
    next() {
        // Currently iterating over an inner Iterable?
        if (this.inner) {
            const result = this.inner.next();
            // If not done, return result
            if (!result.done) {
                return result;
            }
            // Else stop iterating inner Iterable
            this.inner = undefined;
        }
        // Continue with next outer element
        const { value, done } = this.outer.next();
        // If the value is iterable, start iterating over it
        if (utils_1.isIterable(value)) {
            this.inner = value[Symbol.iterator]();
            return this.next();
        }
        return { value, done };
    }
}
exports.FlattenIterator = FlattenIterator;
//# sourceMappingURL=flatten.js.map