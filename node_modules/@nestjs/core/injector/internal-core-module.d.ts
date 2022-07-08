import { DynamicModule } from '@nestjs/common';
import { ExistingProvider, FactoryProvider, ValueProvider } from '@nestjs/common/interfaces';
export declare class InternalCoreModule {
    static register(providers: Array<ValueProvider | FactoryProvider | ExistingProvider>): DynamicModule;
}
