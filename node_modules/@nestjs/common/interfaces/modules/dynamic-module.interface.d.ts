import { Type } from '../type.interface';
import { ModuleMetadata } from './module-metadata.interface';
/**
 * Interface defining a Dynamic Module.
 *
 * @see [Dynamic Modules](https://docs.nestjs.com/modules#dynamic-modules)
 *
 * @publicApi
 */
export interface DynamicModule extends ModuleMetadata {
    /**
     * A module reference
     */
    module: Type<any>;
    /**
     * When "true", makes a module global-scoped.
     *
     * Once imported into any module, a global-scoped module will be visible
     * in all modules. Thereafter, modules that wish to inject a service exported
     * from a global module do not need to import the provider module.
     *
     * @default false
     */
    global?: boolean;
}
