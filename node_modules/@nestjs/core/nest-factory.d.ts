import { INestApplication, INestApplicationContext, INestMicroservice } from '@nestjs/common';
import { NestMicroserviceOptions } from '@nestjs/common/interfaces/microservices/nest-microservice-options.interface';
import { NestApplicationContextOptions } from '@nestjs/common/interfaces/nest-application-context-options.interface';
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
import { AbstractHttpAdapter } from './adapters/http-adapter';
/**
 * @publicApi
 */
export declare class NestFactoryStatic {
    private readonly logger;
    private abortOnError;
    private autoFlushLogs;
    /**
     * Creates an instance of NestApplication.
     *
     * @param module Entry (root) application module class
     * @param options List of options to initialize NestApplication
     *
     * @returns A promise that, when resolved,
     * contains a reference to the NestApplication instance.
     */
    create<T extends INestApplication = INestApplication>(module: any, options?: NestApplicationOptions): Promise<T>;
    /**
     * Creates an instance of NestApplication with the specified `httpAdapter`.
     *
     * @param module Entry (root) application module class
     * @param httpAdapter Adapter to proxy the request/response cycle to
     *    the underlying HTTP server
     * @param options List of options to initialize NestApplication
     *
     * @returns A promise that, when resolved,
     * contains a reference to the NestApplication instance.
     */
    create<T extends INestApplication = INestApplication>(module: any, httpAdapter: AbstractHttpAdapter, options?: NestApplicationOptions): Promise<T>;
    /**
     * Creates an instance of NestMicroservice.
     *
     * @param module Entry (root) application module class
     * @param options Optional microservice configuration
     *
     * @returns A promise that, when resolved,
     * contains a reference to the NestMicroservice instance.
     */
    createMicroservice<T extends object>(module: any, options?: NestMicroserviceOptions & T): Promise<INestMicroservice>;
    /**
     * Creates an instance of NestApplicationContext.
     *
     * @param module Entry (root) application module class
     * @param options Optional Nest application configuration
     *
     * @returns A promise that, when resolved,
     * contains a reference to the NestApplicationContext instance.
     */
    createApplicationContext(module: any, options?: NestApplicationContextOptions): Promise<INestApplicationContext>;
    private createNestInstance;
    private initialize;
    private handleInitializationError;
    private createProxy;
    private createExceptionProxy;
    private createExceptionZone;
    private registerLoggerConfiguration;
    private createHttpAdapter;
    private isHttpServer;
    private setAbortOnError;
    private createAdapterProxy;
}
/**
 * Use NestFactory to create an application instance.
 *
 * ### Specifying an entry module
 *
 * Pass the required *root module* for the application via the module parameter.
 * By convention, it is usually called `ApplicationModule`.  Starting with this
 * module, Nest assembles the dependency graph and begins the process of
 * Dependency Injection and instantiates the classes needed to launch your
 * application.
 *
 * @publicApi
 */
export declare const NestFactory: NestFactoryStatic;
