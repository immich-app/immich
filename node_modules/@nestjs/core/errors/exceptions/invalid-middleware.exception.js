"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidMiddlewareException = void 0;
const messages_1 = require("../messages");
const runtime_exception_1 = require("./runtime.exception");
class InvalidMiddlewareException extends runtime_exception_1.RuntimeException {
    constructor(name) {
        super((0, messages_1.INVALID_MIDDLEWARE_MESSAGE) `${name}`);
    }
}
exports.InvalidMiddlewareException = InvalidMiddlewareException;
