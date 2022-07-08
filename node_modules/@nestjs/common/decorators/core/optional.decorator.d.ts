/**
 * Parameter decorator for an injected dependency marking the
 * dependency as optional.
 *
 * For example:
 * ```typescript
 * constructor(@Optional() @Inject('HTTP_OPTIONS')private readonly httpClient: T) {}
 * ```
 *
 * @see [Optional providers](https://docs.nestjs.com/providers#optional-providers)
 *
 * @publicApi
 */
export declare function Optional(): (target: object, key: string | symbol, index?: number) => void;
