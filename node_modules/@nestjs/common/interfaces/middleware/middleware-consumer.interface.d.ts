import { Type } from '../type.interface';
import { MiddlewareConfigProxy } from './middleware-config-proxy.interface';
/**
 * Interface defining method for applying user defined middleware to routes.
 *
 * @see [MiddlewareConsumer](https://docs.nestjs.com/middleware#middleware-consumer)
 *
 * @publicApi
 */
export interface MiddlewareConsumer {
    /**
     * @param {...(Type | Function)} middleware middleware class/function or array of classes/functions
     * to be attached to the passed routes.
     *
     * @returns {MiddlewareConfigProxy}
     */
    apply(...middleware: (Type<any> | Function)[]): MiddlewareConfigProxy;
}
