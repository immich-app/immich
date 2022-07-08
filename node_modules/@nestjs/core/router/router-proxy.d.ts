import { ExceptionsHandler } from '../exceptions/exceptions-handler';
export declare type RouterProxyCallback = <TRequest, TResponse>(req?: TRequest, res?: TResponse, next?: () => void) => void;
export declare class RouterProxy {
    createProxy(targetCallback: RouterProxyCallback, exceptionsHandler: ExceptionsHandler): <TRequest, TResponse>(req: TRequest, res: TResponse, next: () => void) => Promise<void>;
    createExceptionLayerProxy(targetCallback: <TError, TRequest, TResponse>(err: TError, req: TRequest, res: TResponse, next: () => void) => void, exceptionsHandler: ExceptionsHandler): <TError, TRequest, TResponse>(err: TError, req: TRequest, res: TResponse, next: () => void) => Promise<void>;
}
