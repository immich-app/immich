"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterExceptionFilters = void 0;
const constants_1 = require("@nestjs/common/constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const base_exception_filter_context_1 = require("../exceptions/base-exception-filter-context");
const exceptions_handler_1 = require("../exceptions/exceptions-handler");
const constants_2 = require("../injector/constants");
const iterare_1 = require("iterare");
class RouterExceptionFilters extends base_exception_filter_context_1.BaseExceptionFilterContext {
    constructor(container, config, applicationRef) {
        super(container);
        this.config = config;
        this.applicationRef = applicationRef;
    }
    create(instance, callback, moduleKey, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        this.moduleContext = moduleKey;
        const exceptionHandler = new exceptions_handler_1.ExceptionsHandler(this.applicationRef);
        const filters = this.createContext(instance, callback, constants_1.EXCEPTION_FILTERS_METADATA, contextId, inquirerId);
        if ((0, shared_utils_1.isEmpty)(filters)) {
            return exceptionHandler;
        }
        exceptionHandler.setCustomFilters(filters.reverse());
        return exceptionHandler;
    }
    getGlobalMetadata(contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        const globalFilters = this.config.getGlobalFilters();
        if (contextId === constants_2.STATIC_CONTEXT && !inquirerId) {
            return globalFilters;
        }
        const scopedFilterWrappers = this.config.getGlobalRequestFilters();
        const scopedFilters = (0, iterare_1.iterate)(scopedFilterWrappers)
            .map(wrapper => wrapper.getInstanceByContextId(contextId, inquirerId))
            .filter(host => !!host)
            .map(host => host.instance)
            .toArray();
        return globalFilters.concat(scopedFilters);
    }
}
exports.RouterExceptionFilters = RouterExceptionFilters;
