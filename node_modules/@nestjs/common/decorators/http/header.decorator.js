"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
const constants_1 = require("../../constants");
const extend_metadata_util_1 = require("../../utils/extend-metadata.util");
/**
 * Request method Decorator.  Sets a response header.
 *
 * For example:
 * `@Header('Cache-Control', 'none')`
 *
 * @param name string to be used for header name
 * @param value string to be used for header value
 *
 * @see [Headers](https://docs.nestjs.com/controllers#headers)
 *
 * @publicApi
 */
function Header(name, value) {
    return (target, key, descriptor) => {
        (0, extend_metadata_util_1.extendArrayMetadata)(constants_1.HEADERS_METADATA, [{ name, value }], descriptor.value);
        return descriptor;
    };
}
exports.Header = Header;
