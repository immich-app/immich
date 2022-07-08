"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownRequestMappingException = void 0;
const runtime_exception_1 = require("./runtime.exception");
const messages_1 = require("../messages");
class UnknownRequestMappingException extends runtime_exception_1.RuntimeException {
    constructor() {
        super(messages_1.UNKNOWN_REQUEST_MAPPING);
    }
}
exports.UnknownRequestMappingException = UnknownRequestMappingException;
