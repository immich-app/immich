import { HttpServer } from '@nestjs/common';
import { MiddlewareConfiguration, RouteInfo } from '@nestjs/common/interfaces/middleware/middleware-configuration.interface';
import { ApplicationConfig } from '../application-config';
import { NestContainer } from '../injector/container';
import { Injector } from '../injector/injector';
import { Module } from '../injector/module';
import { MiddlewareContainer } from './container';
export declare class MiddlewareModule {
    private readonly routerProxy;
    private readonly exceptionFiltersCache;
    private injector;
    private routerExceptionFilter;
    private routesMapper;
    private resolver;
    private config;
    private container;
    private httpAdapter;
    register(middlewareContainer: MiddlewareContainer, container: NestContainer, config: ApplicationConfig, injector: Injector, httpAdapter: HttpServer): Promise<void>;
    resolveMiddleware(middlewareContainer: MiddlewareContainer, modules: Map<string, Module>): Promise<void>;
    loadConfiguration(middlewareContainer: MiddlewareContainer, moduleRef: Module, moduleKey: string): Promise<void>;
    registerMiddleware(middlewareContainer: MiddlewareContainer, applicationRef: any): Promise<void>;
    registerMiddlewareConfig(middlewareContainer: MiddlewareContainer, config: MiddlewareConfiguration, moduleKey: string, applicationRef: any): Promise<void>;
    registerRouteMiddleware(middlewareContainer: MiddlewareContainer, routeInfo: RouteInfo, config: MiddlewareConfiguration, moduleKey: string, applicationRef: any): Promise<void>;
    private bindHandler;
    private createProxy;
    private registerHandler;
}
