import { Type } from '../type.interface';
import { RouteInfo } from './middleware-configuration.interface';
import { MiddlewareConsumer } from './middleware-consumer.interface';
export interface MiddlewareConfigProxy {
    /**
     * Excludes routes from the currently processed middleware.
     *
     * @param {(string | RouteInfo)[]} routes
     * @returns {MiddlewareConfigProxy}
     */
    exclude(...routes: (string | RouteInfo)[]): MiddlewareConfigProxy;
    /**
     * Attaches passed either routes or controllers to the currently configured middleware.
     * If you pass a class, Nest would attach middleware to every path defined within this controller.
     *
     * @param {(string | Type | RouteInfo)[]} routes
     * @returns {MiddlewareConsumer}
     */
    forRoutes(...routes: (string | Type<any> | RouteInfo)[]): MiddlewareConsumer;
}
