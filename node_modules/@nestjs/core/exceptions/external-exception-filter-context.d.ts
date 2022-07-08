import { Controller } from '@nestjs/common/interfaces';
import { ApplicationConfig } from '../application-config';
import { NestContainer } from '../injector/container';
import { RouterProxyCallback } from '../router/router-proxy';
import { BaseExceptionFilterContext } from './base-exception-filter-context';
import { ExternalExceptionsHandler } from './external-exceptions-handler';
export declare class ExternalExceptionFilterContext extends BaseExceptionFilterContext {
    private readonly config?;
    constructor(container: NestContainer, config?: ApplicationConfig);
    create(instance: Controller, callback: RouterProxyCallback, module: string, contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): ExternalExceptionsHandler;
    getGlobalMetadata<T extends any[]>(contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): T;
}
