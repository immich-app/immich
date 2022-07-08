/// <reference types="node" />
import { HttpServer, RequestMethod } from '@nestjs/common';
import { IncomingMessage } from 'http';
import { Observable } from 'rxjs';
import { AdditionalHeaders, WritableHeaderStream } from './sse-stream';
export interface CustomHeader {
    name: string;
    value: string;
}
export interface RedirectResponse {
    url: string;
    statusCode?: number;
}
export declare class RouterResponseController {
    private readonly applicationRef;
    private readonly logger;
    constructor(applicationRef: HttpServer);
    apply<TInput = any, TResponse = any>(result: TInput, response: TResponse, httpStatusCode?: number): Promise<any>;
    redirect<TInput = any, TResponse = any>(resultOrDeferred: TInput, response: TResponse, redirectResponse: RedirectResponse): Promise<void>;
    render<TInput = unknown, TResponse = unknown>(resultOrDeferred: TInput, response: TResponse, template: string): Promise<any>;
    transformToResult(resultOrDeferred: any): Promise<any>;
    getStatusByMethod(requestMethod: RequestMethod): number;
    setHeaders<TResponse = unknown>(response: TResponse, headers: CustomHeader[]): void;
    setStatus<TResponse = unknown>(response: TResponse, statusCode: number): void;
    sse<TInput extends Observable<unknown> = any, TResponse extends WritableHeaderStream = any, TRequest extends IncomingMessage = any>(result: TInput, response: TResponse, request: TRequest, options?: {
        additionalHeaders: AdditionalHeaders;
    }): void;
    private assertObservable;
}
