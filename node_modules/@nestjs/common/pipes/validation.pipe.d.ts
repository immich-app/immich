import { ClassTransformOptions } from '../interfaces/external/class-transform-options.interface';
import { TransformerPackage } from '../interfaces/external/transformer-package.interface';
import { ValidationError } from '../interfaces/external/validation-error.interface';
import { ValidatorOptions } from '../interfaces/external/validator-options.interface';
import { ValidatorPackage } from '../interfaces/external/validator-package.interface';
import { ArgumentMetadata, PipeTransform } from '../interfaces/features/pipe-transform.interface';
import { Type } from '../interfaces/type.interface';
import { ErrorHttpStatusCode } from '../utils/http-error-by-code.util';
export interface ValidationPipeOptions extends ValidatorOptions {
    transform?: boolean;
    disableErrorMessages?: boolean;
    transformOptions?: ClassTransformOptions;
    errorHttpStatusCode?: ErrorHttpStatusCode;
    exceptionFactory?: (errors: ValidationError[]) => any;
    validateCustomDecorators?: boolean;
    expectedType?: Type<any>;
    validatorPackage?: ValidatorPackage;
    transformerPackage?: TransformerPackage;
}
export declare class ValidationPipe implements PipeTransform<any> {
    protected isTransformEnabled: boolean;
    protected isDetailedOutputDisabled?: boolean;
    protected validatorOptions: ValidatorOptions;
    protected transformOptions: ClassTransformOptions;
    protected errorHttpStatusCode: ErrorHttpStatusCode;
    protected expectedType: Type<any>;
    protected exceptionFactory: (errors: ValidationError[]) => any;
    protected validateCustomDecorators: boolean;
    constructor(options?: ValidationPipeOptions);
    protected loadValidator(validatorPackage?: ValidatorPackage): ValidatorPackage;
    protected loadTransformer(transformerPackage?: TransformerPackage): TransformerPackage;
    transform(value: any, metadata: ArgumentMetadata): Promise<any>;
    createExceptionFactory(): (validationErrors?: ValidationError[]) => unknown;
    protected toValidate(metadata: ArgumentMetadata): boolean;
    protected transformPrimitive(value: any, metadata: ArgumentMetadata): any;
    protected toEmptyIfNil<T = any, R = any>(value: T): R | {};
    protected stripProtoKeys(value: Record<string, any>): void;
    protected isPrimitive(value: unknown): boolean;
    protected validate(object: object, validatorOptions?: ValidatorOptions): Promise<ValidationError[]> | ValidationError[];
    protected flattenValidationErrors(validationErrors: ValidationError[]): string[];
    protected mapChildrenToValidationErrors(error: ValidationError, parentPath?: string): ValidationError[];
    protected prependConstraintsWithParentProp(parentPath: string, error: ValidationError): ValidationError;
}
