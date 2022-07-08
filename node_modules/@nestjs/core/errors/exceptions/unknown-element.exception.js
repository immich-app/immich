"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownElementException = void 0;
const runtime_exception_1 = require("./runtime.exception");
class UnknownElementException extends runtime_exception_1.RuntimeException {
    constructor(name) {
        name = name && name.toString();
        super(`Nest could not find ${name || 'given'} element (this provider does not exist in the current context)`);
    }
}
exports.UnknownElementException = UnknownElementException;
