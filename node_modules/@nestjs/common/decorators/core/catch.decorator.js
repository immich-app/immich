"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Catch = void 0;
const constants_1 = require("../../constants");
/**
 * Decorator that marks a class as a Nest exception filter. An exception filter
 * handles exceptions thrown by or not handled by your application code.
 *
 * The decorated class must implement the `ExceptionFilter` interface.
 *
 * @param exceptions one or more exception *types* specifying
 * the exceptions to be caught and handled by this filter.
 *
 * @see [Exception Filters](https://docs.nestjs.com/exception-filters)
 *
 * @usageNotes
 * Exception filters are applied using the `@UseFilters()` decorator, or (globally)
 * with `app.useGlobalFilters()`.
 *
 * @publicApi
 */
function Catch(...exceptions) {
    return (target) => {
        Reflect.defineMetadata(constants_1.CATCH_WATERMARK, true, target);
        Reflect.defineMetadata(constants_1.FILTER_CATCH_EXCEPTIONS, exceptions, target);
    };
}
exports.Catch = Catch;
