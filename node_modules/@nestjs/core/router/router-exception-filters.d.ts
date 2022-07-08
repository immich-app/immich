import { HttpServer } from '@nestjs/common';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { ApplicationConfig } from '../application-config';
import { BaseExceptionFilterContext } from '../exceptions/base-exception-filter-context';
import { ExceptionsHandler } from '../exceptions/exceptions-handler';
import { NestContainer } from '../injector/container';
import { RouterProxyCallback } from './router-proxy';
export declare class RouterExceptionFilters extends BaseExceptionFilterContext {
    private readonly config;
    private readonly applicationRef;
    constructor(container: NestContainer, config: ApplicationConfig, applicationRef: HttpServer);
    create(instance: Controller, callback: RouterProxyCallback, moduleKey: string, contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): ExceptionsHandler;
    getGlobalMetadata<T extends unknown[]>(contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): T;
}
