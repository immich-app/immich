"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ZipIterator {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }
    next() {
        const a = this.a.next();
        if (a.done) {
            return { done: true };
        }
        const b = this.b.next();
        if (b.done) {
            return { done: true };
        }
        return { value: [a.value, b.value], done: false };
    }
}
exports.ZipIterator = ZipIterator;
//# sourceMappingURL=zip.js.map