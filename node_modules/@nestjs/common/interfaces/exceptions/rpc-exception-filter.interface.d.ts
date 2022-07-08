import { Observable } from 'rxjs';
import { ArgumentsHost } from '../features/arguments-host.interface';
/**
 * Interface describing implementation of an RPC exception filter.
 *
 * @see [Exception Filters](https://docs.nestjs.com/microservices/exception-filters)
 *
 * @publicApi
 */
export interface RpcExceptionFilter<T = any, R = any> {
    /**
     * Method to implement a custom (microservice) exception filter.
     *
     * @param exception the type (class) of the exception being handled
     * @param host used to access an array of arguments for
     * the in-flight message
     */
    catch(exception: T, host: ArgumentsHost): Observable<R>;
}
