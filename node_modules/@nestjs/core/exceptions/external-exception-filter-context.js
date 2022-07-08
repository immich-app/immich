"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalExceptionFilterContext = void 0;
const constants_1 = require("@nestjs/common/constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const constants_2 = require("../injector/constants");
const base_exception_filter_context_1 = require("./base-exception-filter-context");
const external_exceptions_handler_1 = require("./external-exceptions-handler");
const iterare_1 = require("iterare");
class ExternalExceptionFilterContext extends base_exception_filter_context_1.BaseExceptionFilterContext {
    constructor(container, config) {
        super(container);
        this.config = config;
    }
    create(instance, callback, module, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        this.moduleContext = module;
        const exceptionHandler = new external_exceptions_handler_1.ExternalExceptionsHandler();
        const filters = this.createContext(instance, callback, constants_1.EXCEPTION_FILTERS_METADATA, contextId, inquirerId);
        if ((0, shared_utils_1.isEmpty)(filters)) {
            return exceptionHandler;
        }
        exceptionHandler.setCustomFilters(filters.reverse());
        return exceptionHandler;
    }
    getGlobalMetadata(contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        if (!this.config) {
            return [];
        }
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
exports.ExternalExceptionFilterContext = ExternalExceptionFilterContext;
