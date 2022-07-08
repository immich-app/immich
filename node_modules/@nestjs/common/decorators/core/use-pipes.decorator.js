"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsePipes = void 0;
const constants_1 = require("../../constants");
const extend_metadata_util_1 = require("../../utils/extend-metadata.util");
const shared_utils_1 = require("../../utils/shared.utils");
const validate_each_util_1 = require("../../utils/validate-each.util");
/**
 * Decorator that binds pipes to the scope of the controller or method,
 * depending on its context.
 *
 * When `@UsePipes` is used at the controller level, the pipe will be
 * applied to every handler (method) in the controller.
 *
 * When `@UsePipes` is used at the individual handler level, the pipe
 * will apply only to that specific method.
 *
 * @param pipes a single pipe instance or class, or a list of pipe instances or
 * classes.
 *
 * @see [Pipes](https://docs.nestjs.com/pipes)
 *
 * @usageNotes
 * Pipes can also be set up globally for all controllers and routes
 * using `app.useGlobalPipes()`.  [See here for details](https://docs.nestjs.com/pipes#class-validator)
 *
 * @publicApi
 */
function UsePipes(...pipes) {
    return (target, key, descriptor) => {
        const isPipeValid = (pipe) => pipe &&
            ((0, shared_utils_1.isFunction)(pipe) || (0, shared_utils_1.isFunction)(pipe.transform));
        if (descriptor) {
            (0, extend_metadata_util_1.extendArrayMetadata)(constants_1.PIPES_METADATA, pipes, descriptor.value);
            return descriptor;
        }
        (0, validate_each_util_1.validateEach)(target, pipes, isPipeValid, '@UsePipes', 'pipe');
        (0, extend_metadata_util_1.extendArrayMetadata)(constants_1.PIPES_METADATA, pipes, target);
        return target;
    };
}
exports.UsePipes = UsePipes;
