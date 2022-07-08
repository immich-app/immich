"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseFilters = void 0;
/* eslint-disable @typescript-eslint/no-use-before-define */
const constants_1 = require("../../constants");
const extend_metadata_util_1 = require("../../utils/extend-metadata.util");
const shared_utils_1 = require("../../utils/shared.utils");
const validate_each_util_1 = require("../../utils/validate-each.util");
/**
 * Decorator that binds exception filters to the scope of the controller or
 * method, depending on its context.
 *
 * When `@UseFilters` is used at the controller level, the filter will be
 * applied to every handler (method) in the controller.
 *
 * When `@UseFilters` is used at the individual handler level, the filter
 * will apply only to that specific method.
 *
 * @param filters exception filter instance or class, or a list of exception
 * filter instances or classes.
 *
 * @see [Exception filters](https://docs.nestjs.com/exception-filters)
 *
 * @usageNotes
 * Exception filters can also be set up globally for all controllers and routes
 * using `app.useGlobalFilters()`.  [See here for details](https://docs.nestjs.com/exception-filters#binding-filters)
 *
 * @publicApi
 */
const UseFilters = (...filters) => addExceptionFiltersMetadata(...filters);
exports.UseFilters = UseFilters;
function addExceptionFiltersMetadata(...filters) {
    return (target, key, descriptor) => {
        const isFilterValid = (filter) => filter &&
            ((0, shared_utils_1.isFunction)(filter) || (0, shared_utils_1.isFunction)(filter.catch));
        if (descriptor) {
            (0, validate_each_util_1.validateEach)(target.constructor, filters, isFilterValid, '@UseFilters', 'filter');
            (0, extend_metadata_util_1.extendArrayMetadata)(constants_1.EXCEPTION_FILTERS_METADATA, filters, descriptor.value);
            return descriptor;
        }
        (0, validate_each_util_1.validateEach)(target, filters, isFilterValid, '@UseFilters', 'filter');
        (0, extend_metadata_util_1.extendArrayMetadata)(constants_1.EXCEPTION_FILTERS_METADATA, filters, target);
        return target;
    };
}
