"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bind = void 0;
/**
 * Decorator that binds *parameter decorators* to the method that follows.
 *
 * Useful when the language doesn't provide a 'Parameter Decorator' feature
 * (i.e., vanilla JavaScript).
 *
 * @param decorators one or more parameter decorators (e.g., `Req()`)
 *
 * @publicApi
 */
function Bind(...decorators) {
    return (target, key, descriptor) => {
        decorators.forEach((fn, index) => fn(target, key, index));
        return descriptor;
    };
}
exports.Bind = Bind;
