"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndefinedModuleException = void 0;
const runtime_exception_1 = require("./runtime.exception");
const messages_1 = require("../messages");
class UndefinedModuleException extends runtime_exception_1.RuntimeException {
    constructor(parentModule, index, scope) {
        super((0, messages_1.UNDEFINED_MODULE_MESSAGE)(parentModule, index, scope));
    }
}
exports.UndefinedModuleException = UndefinedModuleException;
