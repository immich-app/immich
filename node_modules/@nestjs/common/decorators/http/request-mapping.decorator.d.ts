import { RequestMethod } from '../../enums/request-method.enum';
export interface RequestMappingMetadata {
    path?: string | string[];
    method?: RequestMethod;
}
export declare const RequestMapping: (metadata?: RequestMappingMetadata) => MethodDecorator;
/**
 * Route handler (method) Decorator. Routes HTTP POST requests to the specified path.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 *
 * @publicApi
 */
export declare const Post: (path?: string | string[]) => MethodDecorator;
/**
 * Route handler (method) Decorator. Routes HTTP GET requests to the specified path.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 *
 * @publicApi
 */
export declare const Get: (path?: string | string[]) => MethodDecorator;
/**
 * Route handler (method) Decorator. Routes HTTP DELETE requests to the specified path.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 *
 * @publicApi
 */
export declare const Delete: (path?: string | string[]) => MethodDecorator;
/**
 * Route handler (method) Decorator. Routes HTTP PUT requests to the specified path.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 *
 * @publicApi
 */
export declare const Put: (path?: string | string[]) => MethodDecorator;
/**
 * Route handler (method) Decorator. Routes HTTP PATCH requests to the specified path.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 *
 * @publicApi
 */
export declare const Patch: (path?: string | string[]) => MethodDecorator;
/**
 * Route handler (method) Decorator. Routes HTTP OPTIONS requests to the specified path.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 *
 * @publicApi
 */
export declare const Options: (path?: string | string[]) => MethodDecorator;
/**
 * Route handler (method) Decorator. Routes HTTP HEAD requests to the specified path.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 *
 * @publicApi
 */
export declare const Head: (path?: string | string[]) => MethodDecorator;
/**
 * Route handler (method) Decorator. Routes all HTTP requests to the specified path.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 *
 * @publicApi
 */
export declare const All: (path?: string | string[]) => MethodDecorator;
