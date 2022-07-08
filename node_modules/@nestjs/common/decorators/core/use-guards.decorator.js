"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseGuards = void 0;
const constants_1 = require("../../constants");
const extend_metadata_util_1 = require("../../utils/extend-metadata.util");
const shared_utils_1 = require("../../utils/shared.utils");
const validate_each_util_1 = require("../../utils/validate-each.util");
/**
 * Decorator that binds guards to the scope of the controller or method,
 * depending on its context.
 *
 * When `@UseGuards` is used at the controller level, the guard will be
 * applied to every handler (method) in the controller.
 *
 * When `@UseGuards` is used at the individual handler level, the guard
 * will apply only to that specific method.
 *
 * @param guards a single guard instance or class, or a list of guard instances
 * or classes.
 *
 * @see [Guards](https://docs.nestjs.com/guards)
 *
 * @usageNotes
 * Guards can also be set up globally for all controllers and routes
 * using `app.useGlobalGuards()`.  [See here for details](https://docs.nestjs.com/guards#binding-guards)
 *
 * @publicApi
 */
function UseGuards(...guards) {
    return (target, key, descriptor) => {
        const isGuardValid = (guard) => guard &&
            ((0, shared_utils_1.isFunction)(guard) ||
                (0, shared_utils_1.isFunction)(guard.canActivate));
        if (descriptor) {
            (0, validate_each_util_1.validateEach)(target.constructor, guards, isGuardValid, '@UseGuards', 'guard');
            (0, extend_metadata_util_1.extendArrayMetadata)(constants_1.GUARDS_METADATA, guards, descriptor.value);
            return descriptor;
        }
        (0, validate_each_util_1.validateEach)(target, guards, isGuardValid, '@UseGuards', 'guard');
        (0, extend_metadata_util_1.extendArrayMetadata)(constants_1.GUARDS_METADATA, guards, target);
        return target;
    };
}
exports.UseGuards = UseGuards;
