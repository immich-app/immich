"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidClassModuleException = void 0;
const messages_1 = require("../messages");
const runtime_exception_1 = require("./runtime.exception");
class InvalidClassModuleException extends runtime_exception_1.RuntimeException {
    constructor(metatypeUsedAsAModule, scope) {
        super((0, messages_1.USING_INVALID_CLASS_AS_A_MODULE_MESSAGE)(metatypeUsedAsAModule, scope));
    }
}
exports.InvalidClassModuleException = InvalidClassModuleException;
