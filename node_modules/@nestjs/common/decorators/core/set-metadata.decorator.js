"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetMetadata = void 0;
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
const SetMetadata = (metadataKey, metadataValue) => {
    const decoratorFactory = (target, key, descriptor) => {
        if (descriptor) {
            Reflect.defineMetadata(metadataKey, metadataValue, descriptor.value);
            return descriptor;
        }
        Reflect.defineMetadata(metadataKey, metadataValue, target);
        return target;
    };
    decoratorFactory.KEY = metadataKey;
    return decoratorFactory;
};
exports.SetMetadata = SetMetadata;
