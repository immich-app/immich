"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redirect = void 0;
const constants_1 = require("../../constants");
/**
 * Redirects request to the specified URL.
 *
 * @publicApi
 */
function Redirect(url = '', statusCode) {
    return (target, key, descriptor) => {
        Reflect.defineMetadata(constants_1.REDIRECT_METADATA, { statusCode, url }, descriptor.value);
        return descriptor;
    };
}
exports.Redirect = Redirect;
