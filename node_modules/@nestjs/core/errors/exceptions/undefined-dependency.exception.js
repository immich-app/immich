"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndefinedDependencyException = void 0;
const messages_1 = require("../messages");
const runtime_exception_1 = require("./runtime.exception");
class UndefinedDependencyException extends runtime_exception_1.RuntimeException {
    constructor(type, undefinedDependencyContext, module) {
        super((0, messages_1.UNKNOWN_DEPENDENCIES_MESSAGE)(type, undefinedDependencyContext, module));
    }
}
exports.UndefinedDependencyException = UndefinedDependencyException;
