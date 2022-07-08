"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = void 0;
const constants_1 = require("../../constants");
/**
 * Sets the version of the endpoint to the passed version
 *
 * @publicApi
 */
function Version(version) {
    if (Array.isArray(version)) {
        // Drop duplicated versions
        version = Array.from(new Set(version));
    }
    return (target, key, descriptor) => {
        Reflect.defineMetadata(constants_1.VERSION_METADATA, version, descriptor.value);
        return descriptor;
    };
}
exports.Version = Version;
