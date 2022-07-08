"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseArrayPipe = void 0;
const tslib_1 = require("tslib");
const injectable_decorator_1 = require("../decorators/core/injectable.decorator");
const optional_decorator_1 = require("../decorators/core/optional.decorator");
const http_status_enum_1 = require("../enums/http-status.enum");
const http_error_by_code_util_1 = require("../utils/http-error-by-code.util");
const shared_utils_1 = require("../utils/shared.utils");
const validation_pipe_1 = require("./validation.pipe");
const VALIDATION_ERROR_MESSAGE = 'Validation failed (parsable array expected)';
const DEFAULT_ARRAY_SEPARATOR = ',';
/**
 * Defines the built-in ParseArray Pipe
 *
 * @see [Built-in Pipes](https://docs.nestjs.com/pipes#built-in-pipes)
 *
 * @publicApi
 */
let ParseArrayPipe = class ParseArrayPipe {
    constructor(options = {}) {
        this.options = options;
        this.validationPipe = new validation_pipe_1.ValidationPipe(Object.assign({ transform: true, validateCustomDecorators: true }, options));
        const { exceptionFactory, errorHttpStatusCode = http_status_enum_1.HttpStatus.BAD_REQUEST } = options;
        this.exceptionFactory =
            exceptionFactory ||
                (error => new http_error_by_code_util_1.HttpErrorByCode[errorHttpStatusCode](error));
    }
    /**
     * Method that accesses and performs optional transformation on argument for
     * in-flight requests.
     *
     * @param value currently processed route argument
     * @param metadata contains metadata about the currently processed route argument
     */
    async transform(value, metadata) {
        if (!value && !this.options.optional) {
            throw this.exceptionFactory(VALIDATION_ERROR_MESSAGE);
        }
        else if ((0, shared_utils_1.isNil)(value) && this.options.optional) {
            return value;
        }
        if (!Array.isArray(value)) {
            if (!(0, shared_utils_1.isString)(value)) {
                throw this.exceptionFactory(VALIDATION_ERROR_MESSAGE);
            }
            else {
                try {
                    value = value
                        .trim()
                        .split(this.options.separator || DEFAULT_ARRAY_SEPARATOR);
                }
                catch (_a) {
                    throw this.exceptionFactory(VALIDATION_ERROR_MESSAGE);
                }
            }
        }
        if (this.options.items) {
            const validationMetadata = {
                metatype: this.options.items,
                type: 'query',
            };
            const isExpectedTypePrimitive = this.isExpectedTypePrimitive();
            const toClassInstance = (item, index) => {
                try {
                    item = JSON.parse(item);
                }
                catch (_a) { }
                if (isExpectedTypePrimitive) {
                    return this.validatePrimitive(item, index);
                }
                return this.validationPipe.transform(item, validationMetadata);
            };
            if (this.options.stopAtFirstError === false) {
                // strict compare to "false" to make sure
                // that this option is disabled by default
                let errors = [];
                const targetArray = value;
                for (let i = 0; i < targetArray.length; i++) {
                    try {
                        targetArray[i] = await toClassInstance(targetArray[i]);
                    }
                    catch (err) {
                        let message;
                        if (err.getResponse) {
                            const response = err.getResponse();
                            if (Array.isArray(response.message)) {
                                message = response.message.map((item) => `[${i}] ${item}`);
                            }
                            else {
                                message = `[${i}] ${response.message}`;
                            }
                        }
                        else {
                            message = err;
                        }
                        errors = errors.concat(message);
                    }
                }
                if (errors.length > 0) {
                    throw this.exceptionFactory(errors);
                }
                return targetArray;
            }
            else {
                value = await Promise.all(value.map(toClassInstance));
            }
        }
        return value;
    }
    isExpectedTypePrimitive() {
        return [Boolean, Number, String].includes(this.options.items);
    }
    validatePrimitive(originalValue, index) {
        if (this.options.items === Number) {
            const value = originalValue !== null && originalValue !== '' ? +originalValue : NaN;
            if (isNaN(value)) {
                throw this.exceptionFactory(`${(0, shared_utils_1.isUndefined)(index) ? '' : `[${index}] `}item must be a number`);
            }
            return value;
        }
        else if (this.options.items === String) {
            if (!(0, shared_utils_1.isString)(originalValue)) {
                return `${originalValue}`;
            }
        }
        else if (this.options.items === Boolean) {
            if (typeof originalValue !== 'boolean') {
                throw this.exceptionFactory(`${(0, shared_utils_1.isUndefined)(index) ? '' : `[${index}] `}item must be a boolean value`);
            }
        }
        return originalValue;
    }
};
ParseArrayPipe = tslib_1.__decorate([
    (0, injectable_decorator_1.Injectable)(),
    tslib_1.__param(0, (0, optional_decorator_1.Optional)()),
    tslib_1.__metadata("design:paramtypes", [Object])
], ParseArrayPipe);
exports.ParseArrayPipe = ParseArrayPipe;
