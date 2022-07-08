"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalExceptionsHandler = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const invalid_exception_filter_exception_1 = require("../errors/exceptions/invalid-exception-filter.exception");
const external_exception_filter_1 = require("./external-exception-filter");
class ExternalExceptionsHandler extends external_exception_filter_1.ExternalExceptionFilter {
    constructor() {
        super(...arguments);
        this.filters = [];
    }
    next(exception, host) {
        const result = this.invokeCustomFilters(exception, host);
        if (result) {
            return result;
        }
        return super.catch(exception, host);
    }
    setCustomFilters(filters) {
        if (!Array.isArray(filters)) {
            throw new invalid_exception_filter_exception_1.InvalidExceptionFilterException();
        }
        this.filters = filters;
    }
    invokeCustomFilters(exception, host) {
        if ((0, shared_utils_1.isEmpty)(this.filters)) {
            return null;
        }
        const isInstanceOf = (metatype) => exception instanceof metatype;
        const filter = this.filters.find(({ exceptionMetatypes }) => {
            const typeExists = !exceptionMetatypes.length || exceptionMetatypes.some(isInstanceOf);
            return typeExists;
        });
        return filter ? filter.func(exception, host) : null;
    }
}
exports.ExternalExceptionsHandler = ExternalExceptionsHandler;
