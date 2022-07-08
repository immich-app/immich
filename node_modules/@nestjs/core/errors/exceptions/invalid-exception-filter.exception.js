"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidExceptionFilterException = void 0;
const runtime_exception_1 = require("./runtime.exception");
const messages_1 = require("../messages");
class InvalidExceptionFilterException extends runtime_exception_1.RuntimeException {
    constructor() {
        super(messages_1.INVALID_EXCEPTION_FILTER);
    }
}
exports.InvalidExceptionFilterException = InvalidExceptionFilterException;
