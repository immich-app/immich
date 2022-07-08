"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseFloatPipe = void 0;
const tslib_1 = require("tslib");
const index_1 = require("../index");
const http_error_by_code_util_1 = require("../utils/http-error-by-code.util");
/**
 * Defines the built-in ParseFloat Pipe
 *
 * @see [Built-in Pipes](https://docs.nestjs.com/pipes#built-in-pipes)
 *
 * @publicApi
 */
let ParseFloatPipe = class ParseFloatPipe {
    constructor(options) {
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
        const isNumeric = ['string', 'number'].includes(typeof value) &&
            !isNaN(parseFloat(value)) &&
            isFinite(value);
        if (!isNumeric) {
            throw this.exceptionFactory('Validation failed (numeric string is expected)');
        }
        return parseFloat(value);
    }
};
ParseFloatPipe = tslib_1.__decorate([
    (0, index_1.Injectable)(),
    tslib_1.__param(0, (0, index_1.Optional)()),
    tslib_1.__metadata("design:paramtypes", [Object])
], ParseFloatPipe);
exports.ParseFloatPipe = ParseFloatPipe;
