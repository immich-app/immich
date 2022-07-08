"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidClassScopeException = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const messages_1 = require("../messages");
const runtime_exception_1 = require("./runtime.exception");
class InvalidClassScopeException extends runtime_exception_1.RuntimeException {
    constructor(metatypeOrToken) {
        let name = (0, shared_utils_1.isFunction)(metatypeOrToken)
            ? metatypeOrToken.name
            : metatypeOrToken;
        name = name && name.toString();
        super((0, messages_1.INVALID_CLASS_SCOPE_MESSAGE) `${name}`);
    }
}
exports.InvalidClassScopeException = InvalidClassScopeException;
