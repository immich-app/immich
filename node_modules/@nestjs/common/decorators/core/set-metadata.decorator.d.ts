export declare type CustomDecorator<TKey = string> = MethodDecorator & ClassDecorator & {
    KEY: TKey;
};
/**
 * Decorator that assigns metadata to the class/function using the
 * specified `key`.
 *
 * Requires two parameters:
 * - `key` - a value defining the key under which the metadata is stored
 * - `value` - metadata to be associated with `key`
 *
 * This metadata can be reflected using the `Reflector` class.
 *
 * Example: `@SetMetadata('roles', ['admin'])`
 *
 * @see [Reflection](https://docs.nestjs.com/guards#reflection)
 *
 * @publicApi
 */
export declare const SetMetadata: <K = string, V = any>(metadataKey: K, metadataValue: V) => CustomDecorator<K>;
