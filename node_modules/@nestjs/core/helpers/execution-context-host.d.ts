import { ExecutionContext } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces';
import { ContextType, HttpArgumentsHost, RpcArgumentsHost, WsArgumentsHost } from '@nestjs/common/interfaces/features/arguments-host.interface';
export declare class ExecutionContextHost implements ExecutionContext {
    private readonly args;
    private readonly constructorRef;
    private readonly handler;
    private contextType;
    constructor(args: any[], constructorRef?: Type<any>, handler?: Function);
    setType<TContext extends string = ContextType>(type: TContext): void;
    getType<TContext extends string = ContextType>(): TContext;
    getClass<T = any>(): Type<T>;
    getHandler(): Function;
    getArgs<T extends Array<any> = any[]>(): T;
    getArgByIndex<T = any>(index: number): T;
    switchToRpc(): RpcArgumentsHost;
    switchToHttp(): HttpArgumentsHost;
    switchToWs(): WsArgumentsHost;
}
