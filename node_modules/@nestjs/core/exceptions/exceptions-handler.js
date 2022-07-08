"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExceptionsHandler = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const invalid_exception_filter_exception_1 = require("../errors/exceptions/invalid-exception-filter.exception");
const base_exception_filter_1 = require("./base-exception-filter");
class ExceptionsHandler extends base_exception_filter_1.BaseExceptionFilter {
    constructor() {
        super(...arguments);
        this.filters = [];
    }
    next(exception, ctx) {
        if (this.invokeCustomFilters(exception, ctx)) {
            return;
        }
        super.catch(exception, ctx);
    }
    setCustomFilters(filters) {
        if (!Array.isArray(filters)) {
            throw new invalid_exception_filter_exception_1.InvalidExceptionFilterException();
        }
        this.filters = filters;
    }
    invokeCustomFilters(exception, ctx) {
        if ((0, shared_utils_1.isEmpty)(this.filters)) {
            return false;
        }
        const isInstanceOf = (metatype) => exception instanceof metatype;
        const filter = this.filters.find(({ exceptionMetatypes }) => {
            const typeExists = !exceptionMetatypes.length || exceptionMetatypes.some(isInstanceOf);
            return typeExists;
        });
        filter && filter.func(exception, ctx);
        return !!filter;
    }
}
exports.ExceptionsHandler = ExceptionsHandler;
