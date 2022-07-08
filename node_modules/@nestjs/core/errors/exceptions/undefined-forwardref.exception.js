"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndefinedForwardRefException = void 0;
const messages_1 = require("../messages");
const runtime_exception_1 = require("./runtime.exception");
class UndefinedForwardRefException extends runtime_exception_1.RuntimeException {
    constructor(scope) {
        super((0, messages_1.UNDEFINED_FORWARDREF_MESSAGE)(scope));
    }
}
exports.UndefinedForwardRefException = UndefinedForwardRefException;
