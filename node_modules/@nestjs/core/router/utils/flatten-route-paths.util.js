"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenRoutePaths = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
function flattenRoutePaths(routes) {
    const result = [];
    routes.forEach(item => {
        if (item.module && item.path) {
            result.push({ module: item.module, path: item.path });
        }
        if (item.children) {
            const childrenRef = item.children;
            childrenRef.forEach(child => {
                if (!(0, shared_utils_1.isString)(child) && child.path) {
                    child.path = (0, shared_utils_1.normalizePath)((0, shared_utils_1.normalizePath)(item.path) + (0, shared_utils_1.normalizePath)(child.path));
                }
                else {
                    result.push({ path: item.path, module: child });
                }
            });
            result.push(...flattenRoutePaths(childrenRef));
        }
    });
    return result;
}
exports.flattenRoutePaths = flattenRoutePaths;
