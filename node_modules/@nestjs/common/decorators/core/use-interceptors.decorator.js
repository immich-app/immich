"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseInterceptors = void 0;
const constants_1 = require("../../constants");
const extend_metadata_util_1 = require("../../utils/extend-metadata.util");
const shared_utils_1 = require("../../utils/shared.utils");
const validate_each_util_1 = require("../../utils/validate-each.util");
/**
 * Decorator that binds interceptors to the scope of the controller or method,
 * depending on its context.
 *
 * When `@UseInterceptors` is used at the controller level, the interceptor will
 * be applied to every handler (method) in the controller.
 *
 * When `@UseInterceptors` is used at the individual handler level, the interceptor
 * will apply only to that specific method.
 *
 * @param interceptors a single interceptor instance or class, or a list of
 * interceptor instances or classes.
 *
 * @see [Interceptors](https://docs.nestjs.com/interceptors)
 *
 * @usageNotes
 * Interceptors can also be set up globally for all controllers and routes
 * using `app.useGlobalInterceptors()`.  [See here for details](https://docs.nestjs.com/interceptors#binding-interceptors)
 *
 * @publicApi
 */
function UseInterceptors(...interceptors) {
    return (target, key, descriptor) => {
        const isInterceptorValid = (interceptor) => interceptor &&
            ((0, shared_utils_1.isFunction)(interceptor) ||
                (0, shared_utils_1.isFunction)(interceptor.intercept));
        if (descriptor) {
            (0, validate_each_util_1.validateEach)(target.constructor, interceptors, isInterceptorValid, '@UseInterceptors', 'interceptor');
            (0, extend_metadata_util_1.extendArrayMetadata)(constants_1.INTERCEPTORS_METADATA, interceptors, descriptor.value);
            return descriptor;
        }
        (0, validate_each_util_1.validateEach)(target, interceptors, isInterceptorValid, '@UseInterceptors', 'interceptor');
        (0, extend_metadata_util_1.extendArrayMetadata)(constants_1.INTERCEPTORS_METADATA, interceptors, target);
        return target;
    };
}
exports.UseInterceptors = UseInterceptors;
