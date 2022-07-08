"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringCleaner = void 0;
function stringCleaner(str) {
    return str ? str.replace(/\s+/g, '').replace(/\n+/g, '') : str;
}
exports.stringCleaner = stringCleaner;
