"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownDependenciesException = void 0;
const messages_1 = require("../messages");
const runtime_exception_1 = require("./runtime.exception");
class UnknownDependenciesException extends runtime_exception_1.RuntimeException {
    constructor(type, unknownDependencyContext, module) {
        super((0, messages_1.UNKNOWN_DEPENDENCIES_MESSAGE)(type, unknownDependencyContext, module));
    }
}
exports.UnknownDependenciesException = UnknownDependenciesException;
