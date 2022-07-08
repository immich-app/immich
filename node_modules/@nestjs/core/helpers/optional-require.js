"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalRequire = void 0;
function optionalRequire(packageName, loaderFn) {
    try {
        return loaderFn ? loaderFn() : require(packageName);
    }
    catch (e) {
        return {};
    }
}
exports.optionalRequire = optionalRequire;
