import { HttpException } from './http.exception';
/**
 * Defines an HTTP exception for *Not Acceptable* type errors.
 *
 * @see [Built-in HTTP exceptions](https://docs.nestjs.com/exception-filters#built-in-http-exceptions)
 *
 * @publicApi
 */
export declare class NotAcceptableException extends HttpException {
    /**
     * Instantiate a `NotAcceptableException` Exception.
     *
     * @example
     * `throw new NotAcceptableException()`
     *
     * @usageNotes
     * The HTTP response status code will be 406.
     * - The `objectOrError` argument defines the JSON response body or the message string.
     * - The `description` argument contains a short description of the HTTP error.
     *
     * By default, the JSON response body contains two properties:
     * - `statusCode`: this will be the value 406.
     * - `error`: the string `'Not Acceptable'` by default; override this by supplying
     * a string in the `error` parameter.
     *
     * If the parameter `objectOrError` is a string, the response body will contain an
     * additional property, `error`, with a short description of the HTTP error. To override the
     * entire JSON response body, pass an object instead. Nest will serialize the object
     * and return it as the JSON response body.
     *
     * @param objectOrError string or object describing the error condition.
     * @param description a short description of the HTTP error.
     */
    constructor(objectOrError?: string | object | any, description?: string);
}
