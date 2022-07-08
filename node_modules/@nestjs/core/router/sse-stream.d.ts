/// <reference types="node" />
import { MessageEvent } from '@nestjs/common/interfaces';
import { IncomingMessage, OutgoingHttpHeaders } from 'http';
import { Transform } from 'stream';
export declare type AdditionalHeaders = Record<string, string[] | string | number | undefined>;
interface ReadHeaders {
    getHeaders?(): AdditionalHeaders;
}
interface WriteHeaders {
    writableEnded?: boolean;
    writeHead?(statusCode: number, reasonPhrase?: string, headers?: OutgoingHttpHeaders): void;
    writeHead?(statusCode: number, headers?: OutgoingHttpHeaders): void;
    flushHeaders?(): void;
}
export declare type WritableHeaderStream = NodeJS.WritableStream & WriteHeaders;
export declare type HeaderStream = WritableHeaderStream & ReadHeaders;
/**
 * Adapted from https://raw.githubusercontent.com/EventSource/node-ssestream
 * Transforms "messages" to W3C event stream content.
 * See https://html.spec.whatwg.org/multipage/server-sent-events.html
 * A message is an object with one or more of the following properties:
 * - data (String or object, which gets turned into JSON)
 * - type
 * - id
 * - retry
 *
 * If constructed with a HTTP Request, it will optimise the socket for streaming.
 * If this stream is piped to an HTTP Response, it will set appropriate headers.
 */
export declare class SseStream extends Transform {
    private lastEventId;
    constructor(req?: IncomingMessage);
    pipe<T extends WritableHeaderStream>(destination: T, options?: {
        additionalHeaders?: AdditionalHeaders;
        end?: boolean;
    }): T;
    _transform(message: MessageEvent, encoding: string, callback: (error?: Error | null, data?: any) => void): void;
    /**
     * Calls `.write` but handles the drain if needed
     */
    writeMessage(message: MessageEvent, cb: (error: Error | null | undefined) => void): void;
}
export {};
