"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseEnumPipe = void 0;
const tslib_1 = require("tslib");
const index_1 = require("../index");
const http_error_by_code_util_1 = require("../utils/http-error-by-code.util");
/**
 * Defines the built-in ParseEnum Pipe
 *
 * @see [Built-in Pipes](https://docs.nestjs.com/pipes#built-in-pipes)
 *
 * @publicApi
 */
let ParseEnumPipe = class ParseEnumPipe {
    constructor(enumType, options) {
        this.enumType = enumType;
        if (!enumType) {
            throw new Error(`"ParseEnumPipe" requires "enumType" argument specified (to validate input values).`);
        }
        options = options || {};
        const { exceptionFactory, errorHttpStatusCode = index_1.HttpStatus.BAD_REQUEST } = options;
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
        if (!this.isEnum(value)) {
            throw this.exceptionFactory('Validation failed (enum string is expected)');
        }
        return value;
    }
    isEnum(value) {
        const enumValues = Object.keys(this.enumType).map(item => this.enumType[item]);
        return enumValues.includes(value);
    }
};
ParseEnumPipe = tslib_1.__decorate([
    (0, index_1.Injectable)(),
    tslib_1.__param(1, (0, index_1.Optional)()),
    tslib_1.__metadata("design:paramtypes", [Object, Object])
], ParseEnumPipe);
exports.ParseEnumPipe = ParseEnumPipe;
