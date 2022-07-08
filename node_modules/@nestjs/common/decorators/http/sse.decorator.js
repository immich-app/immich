"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sse = void 0;
const constants_1 = require("../../constants");
const request_method_enum_1 = require("../../enums/request-method.enum");
/**
 * Declares this route as a Server-Sent-Events endpoint
 *
 * @publicApi
 */
function Sse(path) {
    return (target, key, descriptor) => {
        path = path && path.length ? path : '/';
        Reflect.defineMetadata(constants_1.PATH_METADATA, path, descriptor.value);
        Reflect.defineMetadata(constants_1.METHOD_METADATA, request_method_enum_1.RequestMethod.GET, descriptor.value);
        Reflect.defineMetadata(constants_1.SSE_METADATA, true, descriptor.value);
        return descriptor;
    };
}
exports.Sse = Sse;
