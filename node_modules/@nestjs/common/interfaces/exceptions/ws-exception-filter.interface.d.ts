import { ArgumentsHost } from '../features/arguments-host.interface';
/**
 * Interface describing implementation of a Web Sockets exception filter.
 *
 * @see [Exception Filters](https://docs.nestjs.com/websockets/exception-filters)
 *
 * @publicApi
 */
export interface WsExceptionFilter<T = any> {
    /**
     * Method to implement a custom (web sockets) exception filter.
     *
     * @param exception the type (class) of the exception being handled
     * @param host used to access an array of arguments for
     * the in-flight message  catch(exception: T, host: ArgumentsHost): any;
     */
    catch(exception: T, host: ArgumentsHost): any;
}
