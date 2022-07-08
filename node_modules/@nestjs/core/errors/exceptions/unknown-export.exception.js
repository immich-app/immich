"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownExportException = void 0;
const messages_1 = require("../messages");
const runtime_exception_1 = require("./runtime.exception");
class UnknownExportException extends runtime_exception_1.RuntimeException {
    constructor(token, moduleName) {
        super((0, messages_1.UNKNOWN_EXPORT_MESSAGE)(token, moduleName));
    }
}
exports.UnknownExportException = UnknownExportException;
