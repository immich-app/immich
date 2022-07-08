"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpCode = void 0;
const constants_1 = require("../../constants");
/**
 * Request method Decorator.  Defines the HTTP response status code.  Overrides
 * default status code for the decorated request method.
 *
 * @param statusCode HTTP response code to be returned by route handler.
 *
 * @see [Http Status Codes](https://docs.nestjs.com/controllers#status-code)
 *
 * @publicApi
 */
function HttpCode(statusCode) {
    return (target, key, descriptor) => {
        Reflect.defineMetadata(constants_1.HTTP_CODE_METADATA, statusCode, descriptor.value);
        return descriptor;
    };
}
exports.HttpCode = HttpCode;
