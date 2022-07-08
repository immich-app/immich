"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateModuleKeys = exports.INVALID_MODULE_CONFIG_MESSAGE = void 0;
const constants_1 = require("../constants");
const INVALID_MODULE_CONFIG_MESSAGE = (text, property) => `Invalid property '${property}' passed into the @Module() decorator.`;
exports.INVALID_MODULE_CONFIG_MESSAGE = INVALID_MODULE_CONFIG_MESSAGE;
const metadataKeys = [
    constants_1.MODULE_METADATA.IMPORTS,
    constants_1.MODULE_METADATA.EXPORTS,
    constants_1.MODULE_METADATA.CONTROLLERS,
    constants_1.MODULE_METADATA.PROVIDERS,
];
function validateModuleKeys(keys) {
    const validateKey = (key) => {
        if (metadataKeys.includes(key)) {
            return;
        }
        throw new Error((0, exports.INVALID_MODULE_CONFIG_MESSAGE) `${key}`);
    };
    keys.forEach(validateKey);
}
exports.validateModuleKeys = validateModuleKeys;
