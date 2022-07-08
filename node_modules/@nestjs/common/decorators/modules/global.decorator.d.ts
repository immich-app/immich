/**
 * Decorator that makes a module global-scoped.
 *
 * Once imported into any module, a global-scoped module will be visible
 * in all modules. Thereafter, modules that wish to inject a service exported
 * from a global module do not need to import the provider module.
 *
 * @see [Global modules](https://docs.nestjs.com/modules#global-modules)
 *
 * @publicApi
 */
export declare function Global(): ClassDecorator;
