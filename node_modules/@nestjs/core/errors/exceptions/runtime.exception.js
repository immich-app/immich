"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeException = void 0;
class RuntimeException extends Error {
    constructor(message = ``) {
        super(message);
    }
    what() {
        return this.message;
    }
}
exports.RuntimeException = RuntimeException;
