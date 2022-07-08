import { HttpServer, RequestMethod } from '@nestjs/common';
import { RequestHandler } from '@nestjs/common/interfaces';
import { CorsOptions, CorsOptionsDelegate } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
/**
 * @publicApi
 */
export declare abstract class AbstractHttpAdapter<TServer = any, TRequest = any, TResponse = any> implements HttpServer<TRequest, TResponse> {
    protected instance?: any;
    protected httpServer: TServer;
    constructor(instance?: any);
    init(): Promise<void>;
    use(...args: any[]): any;
    get(handler: RequestHandler): any;
    get(path: any, handler: RequestHandler): any;
    post(handler: RequestHandler): any;
    post(path: any, handler: RequestHandler): any;
    head(handler: RequestHandler): any;
    head(path: any, handler: RequestHandler): any;
    delete(handler: RequestHandler): any;
    delete(path: any, handler: RequestHandler): any;
    put(handler: RequestHandler): any;
    put(path: any, handler: RequestHandler): any;
    patch(handler: RequestHandler): any;
    patch(path: any, handler: RequestHandler): any;
    all(handler: RequestHandler): any;
    all(path: any, handler: RequestHandler): any;
    options(handler: RequestHandler): any;
    options(path: any, handler: RequestHandler): any;
    listen(port: string | number, callback?: () => void): any;
    listen(port: string | number, hostname: string, callback?: () => void): any;
    getHttpServer(): TServer;
    setHttpServer(httpServer: TServer): void;
    setInstance<T = any>(instance: T): void;
    getInstance<T = any>(): T;
    abstract close(): any;
    abstract initHttpServer(options: NestApplicationOptions): any;
    abstract useStaticAssets(...args: any[]): any;
    abstract setViewEngine(engine: string): any;
    abstract getRequestHostname(request: any): any;
    abstract getRequestMethod(request: any): any;
    abstract getRequestUrl(request: any): any;
    abstract status(response: any, statusCode: number): any;
    abstract reply(response: any, body: any, statusCode?: number): any;
    abstract render(response: any, view: string, options: any): any;
    abstract redirect(response: any, statusCode: number, url: string): any;
    abstract setErrorHandler(handler: Function, prefix?: string): any;
    abstract setNotFoundHandler(handler: Function, prefix?: string): any;
    abstract setHeader(response: any, name: string, value: string): any;
    abstract registerParserMiddleware(prefix?: string): any;
    abstract enableCors(options: CorsOptions | CorsOptionsDelegate<TRequest>, prefix?: string): any;
    abstract createMiddlewareFactory(requestMethod: RequestMethod): ((path: string, callback: Function) => any) | Promise<(path: string, callback: Function) => any>;
    abstract getType(): string;
}
