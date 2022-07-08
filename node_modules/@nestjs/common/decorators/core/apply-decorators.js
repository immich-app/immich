"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDecorators = void 0;
/**
 * Function that returns a new decorator that applies all decorators provided by param
 *
 * Useful to build new decorators (or a decorator factory) encapsulating multiple decorators related with the same feature
 *
 * @param decorators one or more decorators (e.g., `ApplyGuard(...)`)
 *
 * @publicApi
 */
function applyDecorators(...decorators) {
    return (target, propertyKey, descriptor) => {
        for (const decorator of decorators) {
            if (target instanceof Function && !descriptor) {
                decorator(target);
                continue;
            }
            decorator(target, propertyKey, descriptor);
        }
    };
}
exports.applyDecorators = applyDecorators;
