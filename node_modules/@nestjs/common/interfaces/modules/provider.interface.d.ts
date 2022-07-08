import { Scope } from '../scope-options.interface';
import { Type } from '../type.interface';
import { InjectionToken } from './injection-token.interface';
import { OptionalFactoryDependency } from './optional-factory-dependency.interface';
/**
 *
 * @publicApi
 */
export declare type Provider<T = any> = Type<any> | ClassProvider<T> | ValueProvider<T> | FactoryProvider<T> | ExistingProvider<T>;
/**
 * Interface defining a *Class* type provider.
 *
 * For example:
 * ```typescript
 * const configServiceProvider = {
 * provide: ConfigService,
 * useClass:
 *   process.env.NODE_ENV === 'development'
 *     ? DevelopmentConfigService
 *     : ProductionConfigService,
 * };
 * ```
 *
 * @see [Class providers](https://docs.nestjs.com/fundamentals/custom-providers#class-providers-useclass)
 * @see [Injection scopes](https://docs.nestjs.com/fundamentals/injection-scopes)
 *
 * @publicApi
 */
export interface ClassProvider<T = any> {
    /**
     * Injection token
     */
    provide: InjectionToken;
    /**
     * Type (class name) of provider (instance to be injected).
     */
    useClass: Type<T>;
    /**
     * Optional enum defining lifetime of the provider that is injected.
     */
    scope?: Scope;
}
/**
 * Interface defining a *Value* type provider.
 *
 * For example:
 * ```typescript
 * const connectionProvider = {
 *   provide: 'CONNECTION',
 *   useValue: connection,
 * };
 * ```
 *
 * @see [Value providers](https://docs.nestjs.com/fundamentals/custom-providers#value-providers-usevalue)
 *
 * @publicApi
 */
export interface ValueProvider<T = any> {
    /**
     * Injection token
     */
    provide: InjectionToken;
    /**
     * Instance of a provider to be injected.
     */
    useValue: T;
}
/**
 * Interface defining a *Factory* type provider.
 *
 * For example:
 * ```typescript
 * const connectionFactory = {
 *   provide: 'CONNECTION',
 *   useFactory: (optionsProvider: OptionsProvider) => {
 *     const options = optionsProvider.get();
 *     return new DatabaseConnection(options);
 *   },
 *   inject: [OptionsProvider],
 * };
 * ```
 *
 * @see [Factory providers](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory)
 * @see [Injection scopes](https://docs.nestjs.com/fundamentals/injection-scopes)
 *
 * @publicApi
 */
export interface FactoryProvider<T = any> {
    /**
     * Injection token
     */
    provide: InjectionToken;
    /**
     * Factory function that returns an instance of the provider to be injected.
     */
    useFactory: (...args: any[]) => T;
    /**
     * Optional list of providers to be injected into the context of the Factory function.
     */
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    /**
     * Optional enum defining lifetime of the provider that is returned by the Factory function.
     */
    scope?: Scope;
}
/**
 * Interface defining an *Existing* (aliased) type provider.
 *
 * For example:
 * ```typescript
 * const loggerAliasProvider = {
 *   provide: 'AliasedLoggerService',
 *   useExisting: LoggerService
 * };
 * ```
 *
 * @see [Alias providers](https://docs.nestjs.com/fundamentals/custom-providers#alias-providers-useexisting)
 *
 * @publicApi
 */
export interface ExistingProvider<T = any> {
    /**
     * Injection token
     */
    provide: InjectionToken;
    /**
     * Provider to be aliased by the Injection token.
     */
    useExisting: any;
}
