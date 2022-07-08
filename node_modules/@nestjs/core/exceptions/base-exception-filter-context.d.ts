import { Type } from '@nestjs/common/interfaces';
import { ExceptionFilter } from '@nestjs/common/interfaces/exceptions/exception-filter.interface';
import { ContextCreator } from '../helpers/context-creator';
import { NestContainer } from '../injector/container';
import { InstanceWrapper } from '../injector/instance-wrapper';
export declare class BaseExceptionFilterContext extends ContextCreator {
    private readonly container;
    protected moduleContext: string;
    constructor(container: NestContainer);
    createConcreteContext<T extends any[], R extends any[]>(metadata: T, contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): R;
    getFilterInstance(filter: Function | ExceptionFilter, contextId?: import("../injector/instance-wrapper").ContextId, inquirerId?: string): ExceptionFilter | null;
    getInstanceByMetatype(metatype: Type<unknown>): InstanceWrapper | undefined;
    reflectCatchExceptions(instance: ExceptionFilter): Type<any>[];
}
