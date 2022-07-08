import { Controller } from '@nestjs/common/interfaces';
import { ContextId } from '../injector/instance-wrapper';
export declare abstract class ContextCreator {
    abstract createConcreteContext<T extends any[], R extends any[]>(metadata: T, contextId?: ContextId, inquirerId?: string): R;
    getGlobalMetadata?<T extends any[]>(contextId?: ContextId, inquirerId?: string): T;
    createContext<T extends unknown[] = any, R extends unknown[] = any>(instance: Controller, callback: (...args: any[]) => void, metadataKey: string, contextId?: ContextId, inquirerId?: string): R;
    reflectClassMetadata<T>(instance: Controller, metadataKey: string): T;
    reflectMethodMetadata<T>(callback: (...args: unknown[]) => unknown, metadataKey: string): T;
}
