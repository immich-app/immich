import { HttpServer } from '@nestjs/common/interfaces';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { ApplicationConfig } from '../application-config';
import { NestContainer } from '../injector/container';
import { Injector } from '../injector/injector';
import { InstanceWrapper } from '../injector/instance-wrapper';
import { Resolver } from './interfaces/resolver.interface';
export declare class RoutesResolver implements Resolver {
    private readonly container;
    private readonly applicationConfig;
    private readonly injector;
    private readonly logger;
    private readonly routerProxy;
    private readonly routePathFactory;
    private readonly routerExceptionsFilter;
    private readonly routerExplorer;
    constructor(container: NestContainer, applicationConfig: ApplicationConfig, injector: Injector);
    resolve<T extends HttpServer>(applicationRef: T, globalPrefix: string): void;
    registerRouters(routes: Map<string | symbol | Function, InstanceWrapper<Controller>>, moduleName: string, globalPrefix: string, modulePath: string, applicationRef: HttpServer): void;
    registerNotFoundHandler(): void;
    registerExceptionHandler(): void;
    mapExternalException(err: any): any;
    private getModulePathMetadata;
    private getHostMetadata;
    private getVersionMetadata;
}
