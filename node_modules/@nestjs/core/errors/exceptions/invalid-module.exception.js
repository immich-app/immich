"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidModuleException = void 0;
const messages_1 = require("../messages");
const runtime_exception_1 = require("./runtime.exception");
class InvalidModuleException extends runtime_exception_1.RuntimeException {
    constructor(parentModule, index, scope) {
        super((0, messages_1.INVALID_MODULE_MESSAGE)(parentModule, index, scope));
    }
}
exports.InvalidModuleException = InvalidModuleException;
