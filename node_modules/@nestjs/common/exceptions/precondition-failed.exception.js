"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreconditionFailedException = void 0;
const http_status_enum_1 = require("../enums/http-status.enum");
const http_exception_1 = require("./http.exception");
/**
 * Defines an HTTP exception for *Precondition Failed* type errors.
 *
 * @see [Built-in HTTP exceptions](https://docs.nestjs.com/exception-filters#built-in-http-exceptions)
 *
 * @publicApi
 */
class PreconditionFailedException extends http_exception_1.HttpException {
    /**
     * Instantiate a `PreconditionFailedException` Exception.
     *
     * @example
     * `throw new PreconditionFailedException()`
     *
     * @usageNotes
     * The HTTP response status code will be 412.
     * - The `objectOrError` argument defines the JSON response body or the message string.
     * - The `description` argument contains a short description of the HTTP error.
     *
     * By default, the JSON response body contains two properties:
     * - `statusCode`: this will be the value 412.
     * - `message`: the string `'Precondition Failed'` by default; override this by supplying
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
    constructor(objectOrError, description = 'Precondition Failed') {
        super(http_exception_1.HttpException.createBody(objectOrError, description, http_status_enum_1.HttpStatus.PRECONDITION_FAILED), http_status_enum_1.HttpStatus.PRECONDITION_FAILED);
    }
}
exports.PreconditionFailedException = PreconditionFailedException;
