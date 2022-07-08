"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultValuePipe = void 0;
const tslib_1 = require("tslib");
const injectable_decorator_1 = require("../decorators/core/injectable.decorator");
const shared_utils_1 = require("../utils/shared.utils");
/**
 * Defines the built-in DefaultValue Pipe
 *
 * @see [Built-in Pipes](https://docs.nestjs.com/pipes#built-in-pipes)
 *
 * @publicApi
 */
let DefaultValuePipe = class DefaultValuePipe {
    constructor(defaultValue) {
        this.defaultValue = defaultValue;
    }
    transform(value, _metadata) {
        if ((0, shared_utils_1.isNil)(value) ||
            ((0, shared_utils_1.isNumber)(value) && isNaN(value))) {
            return this.defaultValue;
        }
        return value;
    }
};
DefaultValuePipe = tslib_1.__decorate([
    (0, injectable_decorator_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [Object])
], DefaultValuePipe);
exports.DefaultValuePipe = DefaultValuePipe;
