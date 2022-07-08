"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodNotAllowedException = void 0;
const http_status_enum_1 = require("../enums/http-status.enum");
const http_exception_1 = require("./http.exception");
/**
 * Defines an HTTP exception for *Method Not Allowed* type errors.
 *
 * @see [Built-in HTTP exceptions](https://docs.nestjs.com/exception-filters#built-in-http-exceptions)
 *
 * @publicApi
 */
class MethodNotAllowedException extends http_exception_1.HttpException {
    /**
     * Instantiate a `MethodNotAllowedException` Exception.
     *
     * @example
     * `throw new MethodNotAllowedException()`
     *
     * @usageNotes
     * The HTTP response status code will be 405.
     * - The `objectOrError` argument defines the JSON response body or the message string.
     * - The `description` argument contains a short description of the HTTP error.
     *
     * By default, the JSON response body contains two properties:
     * - `statusCode`: this will be the value 405.
     * - `message`: the string `'Method Not Allowed'` by default; override this by supplying
     * a string in the `objectOrError` parameter.
     *
     * If the parameter `objectOrError` is a string, the response body will contain an
     * additional property, `error`, with a short description of the HTTP error. To override the
     * entire JSON response body, pass an object instead. Nest will serialize the object
     * and return it as the JSON response body.
     *
     * @param objectOrError string or object describing the error condition.
     * @param description a short description of the HTTP error.
     */
    constructor(objectOrError, description = 'Method Not Allowed') {
        super(http_exception_1.HttpException.createBody(objectOrError, description, http_status_enum_1.HttpStatus.METHOD_NOT_ALLOWED), http_status_enum_1.HttpStatus.METHOD_NOT_ALLOWED);
    }
}
exports.MethodNotAllowedException = MethodNotAllowedException;
