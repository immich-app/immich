import { Type } from '../type.interface';
import { ClassTransformOptions } from './class-transform-options.interface';
export interface TransformerPackage {
    plainToClass<T>(cls: Type<T>, plain: unknown, options?: ClassTransformOptions): T | T[];
    classToPlain(object: unknown, options?: ClassTransformOptions): Record<string, any> | Record<string, any>[];
}
