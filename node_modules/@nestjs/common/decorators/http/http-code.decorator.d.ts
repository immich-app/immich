/**
 * Request method Decorator.  Defines the HTTP response status code.  Overrides
 * default status code for the decorated request method.
 *
 * @param statusCode HTTP response code to be returned by route handler.
 *
 * @see [Http Status Codes](https://docs.nestjs.com/controllers#status-code)
 *
 * @publicApi
 */
export declare function HttpCode(statusCode: number): MethodDecorator;
