import { Observable } from 'rxjs';
import { CallHandler, ExecutionContext, HttpServer, NestInterceptor } from '../../interfaces';
export interface HttpAdapterHost<T extends HttpServer = any> {
    httpAdapter: T;
}
export declare class CacheInterceptor implements NestInterceptor {
    protected readonly cacheManager: any;
    protected readonly reflector: any;
    protected readonly httpAdapterHost: HttpAdapterHost;
    protected allowedMethods: string[];
    constructor(cacheManager: any, reflector: any);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
    protected trackBy(context: ExecutionContext): string | undefined;
    protected isRequestCacheable(context: ExecutionContext): boolean;
}
