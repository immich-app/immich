import { ValidationError } from './validation-error.interface';
import { ValidatorOptions } from './validator-options.interface';
export interface ValidatorPackage {
    validate(object: unknown, validatorOptions?: ValidatorOptions): ValidationError[] | Promise<ValidationError[]>;
}
