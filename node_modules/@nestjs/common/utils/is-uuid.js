"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUUID = void 0;
const exceptions_1 = require("../exceptions");
const shared_utils_1 = require("./shared.utils");
const uuid = {
    3: /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
    4: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
    5: /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
    all: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
};
function isUUID(str, version = 'all') {
    if (!(0, shared_utils_1.isString)(str)) {
        throw new exceptions_1.BadRequestException('The value passed as UUID is not a string');
    }
    const pattern = uuid[version];
    return pattern && pattern.test(str);
}
exports.isUUID = isUUID;
