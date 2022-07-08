"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseUUIDPipe = void 0;
const tslib_1 = require("tslib");
const injectable_decorator_1 = require("../decorators/core/injectable.decorator");
const optional_decorator_1 = require("../decorators/core/optional.decorator");
const http_status_enum_1 = require("../enums/http-status.enum");
const http_error_by_code_util_1 = require("../utils/http-error-by-code.util");
const is_uuid_1 = require("../utils/is-uuid");
let ParseUUIDPipe = class ParseUUIDPipe {
    constructor(options) {
        options = options || {};
        const { exceptionFactory, errorHttpStatusCode = http_status_enum_1.HttpStatus.BAD_REQUEST, version, } = options;
        this.version = version;
        this.exceptionFactory =
            exceptionFactory ||
                (error => new http_error_by_code_util_1.HttpErrorByCode[errorHttpStatusCode](error));
    }
    async transform(value, metadata) {
        if (!(0, is_uuid_1.isUUID)(value, this.version)) {
            throw this.exceptionFactory(`Validation failed (uuid ${this.version ? 'v' + this.version : ''} is expected)`);
        }
        return value;
    }
};
ParseUUIDPipe = tslib_1.__decorate([
    (0, injectable_decorator_1.Injectable)(),
    tslib_1.__param(0, (0, optional_decorator_1.Optional)()),
    tslib_1.__metadata("design:paramtypes", [Object])
], ParseUUIDPipe);
exports.ParseUUIDPipe = ParseUUIDPipe;
