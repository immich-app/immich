import { ArgumentsHost } from '../features/arguments-host.interface';
/**
 * Interface describing implementation of an exception filter.
 *
 * @see [Exception Filters](https://docs.nestjs.com/exception-filters)
 *
 * @publicApi
 */
export interface ExceptionFilter<T = any> {
    /**
     * Method to implement a custom exception filter.
     *
     * @param exception the class of the exception being handled
     * @param host used to access an array of arguments for
     * the in-flight request
     */
    catch(exception: T, host: ArgumentsHost): any;
}
