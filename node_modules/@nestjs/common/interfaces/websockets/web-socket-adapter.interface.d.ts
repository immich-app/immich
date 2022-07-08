import { Observable } from 'rxjs';
export interface WsMessageHandler<T = string> {
    message: T;
    callback: (...args: any[]) => Observable<any> | Promise<any>;
}
export interface WebSocketAdapter<TServer = any, TClient = any, TOptions = any> {
    create(port: number, options?: TOptions): TServer;
    bindClientConnect(server: TServer, callback: Function): any;
    bindClientDisconnect?(client: TClient, callback: Function): any;
    bindMessageHandlers(client: TClient, handlers: WsMessageHandler[], transform: (data: any) => Observable<any>): any;
    close(server: TServer): any;
}
