"use strict";
var Logger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const tslib_1 = require("tslib");
const injectable_decorator_1 = require("../decorators/core/injectable.decorator");
const optional_decorator_1 = require("../decorators/core/optional.decorator");
const shared_utils_1 = require("../utils/shared.utils");
const console_logger_service_1 = require("./console-logger.service");
const utils_1 = require("./utils");
const DEFAULT_LOGGER = new console_logger_service_1.ConsoleLogger();
let Logger = Logger_1 = class Logger {
    constructor(context, options = {}) {
        this.context = context;
        this.options = options;
    }
    get localInstance() {
        if (Logger_1.staticInstanceRef === DEFAULT_LOGGER) {
            return this.registerLocalInstanceRef();
        }
        else if (Logger_1.staticInstanceRef instanceof Logger_1) {
            const prototype = Object.getPrototypeOf(Logger_1.staticInstanceRef);
            if (prototype.constructor === Logger_1) {
                return this.registerLocalInstanceRef();
            }
        }
        return Logger_1.staticInstanceRef;
    }
    error(message, ...optionalParams) {
        var _a;
        optionalParams = this.context
            ? optionalParams.concat(this.context)
            : optionalParams;
        (_a = this.localInstance) === null || _a === void 0 ? void 0 : _a.error(message, ...optionalParams);
    }
    log(message, ...optionalParams) {
        var _a;
        optionalParams = this.context
            ? optionalParams.concat(this.context)
            : optionalParams;
        (_a = this.localInstance) === null || _a === void 0 ? void 0 : _a.log(message, ...optionalParams);
    }
    warn(message, ...optionalParams) {
        var _a;
        optionalParams = this.context
            ? optionalParams.concat(this.context)
            : optionalParams;
        (_a = this.localInstance) === null || _a === void 0 ? void 0 : _a.warn(message, ...optionalParams);
    }
    debug(message, ...optionalParams) {
        var _a, _b;
        optionalParams = this.context
            ? optionalParams.concat(this.context)
            : optionalParams;
        (_b = (_a = this.localInstance) === null || _a === void 0 ? void 0 : _a.debug) === null || _b === void 0 ? void 0 : _b.call(_a, message, ...optionalParams);
    }
    verbose(message, ...optionalParams) {
        var _a, _b;
        optionalParams = this.context
            ? optionalParams.concat(this.context)
            : optionalParams;
        (_b = (_a = this.localInstance) === null || _a === void 0 ? void 0 : _a.verbose) === null || _b === void 0 ? void 0 : _b.call(_a, message, ...optionalParams);
    }
    static error(message, ...optionalParams) {
        var _a;
        (_a = this.staticInstanceRef) === null || _a === void 0 ? void 0 : _a.error(message, ...optionalParams);
    }
    static log(message, ...optionalParams) {
        var _a;
        (_a = this.staticInstanceRef) === null || _a === void 0 ? void 0 : _a.log(message, ...optionalParams);
    }
    static warn(message, ...optionalParams) {
        var _a;
        (_a = this.staticInstanceRef) === null || _a === void 0 ? void 0 : _a.warn(message, ...optionalParams);
    }
    static debug(message, ...optionalParams) {
        var _a, _b;
        (_b = (_a = this.staticInstanceRef) === null || _a === void 0 ? void 0 : _a.debug) === null || _b === void 0 ? void 0 : _b.call(_a, message, ...optionalParams);
    }
    static verbose(message, ...optionalParams) {
        var _a, _b;
        (_b = (_a = this.staticInstanceRef) === null || _a === void 0 ? void 0 : _a.verbose) === null || _b === void 0 ? void 0 : _b.call(_a, message, ...optionalParams);
    }
    /**
     * Print buffered logs and detach buffer.
     */
    static flush() {
        this.isBufferAttached = false;
        this.logBuffer.forEach(item => item.methodRef(...item.arguments));
        this.logBuffer = [];
    }
    /**
     * Attach buffer.
     * Turns on initialisation logs buffering.
     */
    static attachBuffer() {
        this.isBufferAttached = true;
    }
    /**
     * Detach buffer.
     * Turns off initialisation logs buffering.
     */
    static detachBuffer() {
        this.isBufferAttached = false;
    }
    static getTimestamp() {
        const localeStringOptions = {
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            day: '2-digit',
            month: '2-digit',
        };
        return new Date(Date.now()).toLocaleString(undefined, localeStringOptions);
    }
    static overrideLogger(logger) {
        var _a;
        if (Array.isArray(logger)) {
            Logger_1.logLevels = logger;
            return (_a = this.staticInstanceRef) === null || _a === void 0 ? void 0 : _a.setLogLevels(logger);
        }
        if ((0, shared_utils_1.isObject)(logger)) {
            if (logger instanceof Logger_1 && logger.constructor !== Logger_1) {
                const errorMessage = `Using the "extends Logger" instruction is not allowed in Nest v8. Please, use "extends ConsoleLogger" instead.`;
                this.staticInstanceRef.error(errorMessage);
                throw new Error(errorMessage);
            }
            this.staticInstanceRef = logger;
        }
        else {
            this.staticInstanceRef = undefined;
        }
    }
    static isLevelEnabled(level) {
        const logLevels = Logger_1.logLevels;
        return (0, utils_1.isLogLevelEnabled)(level, logLevels);
    }
    registerLocalInstanceRef() {
        var _a;
        if (this.localInstanceRef) {
            return this.localInstanceRef;
        }
        this.localInstanceRef = new console_logger_service_1.ConsoleLogger(this.context, {
            timestamp: (_a = this.options) === null || _a === void 0 ? void 0 : _a.timestamp,
            logLevels: Logger_1.logLevels,
        });
        return this.localInstanceRef;
    }
};
Logger.logBuffer = new Array();
Logger.staticInstanceRef = DEFAULT_LOGGER;
Logger.WrapBuffer = (target, propertyKey, descriptor) => {
    const originalFn = descriptor.value;
    descriptor.value = function (...args) {
        if (Logger_1.isBufferAttached) {
            Logger_1.logBuffer.push({
                methodRef: originalFn.bind(this),
                arguments: args,
            });
            return;
        }
        return originalFn.call(this, ...args);
    };
};
tslib_1.__decorate([
    Logger_1.WrapBuffer,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Logger.prototype, "error", null);
tslib_1.__decorate([
    Logger_1.WrapBuffer,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Logger.prototype, "log", null);
tslib_1.__decorate([
    Logger_1.WrapBuffer,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Logger.prototype, "warn", null);
tslib_1.__decorate([
    Logger_1.WrapBuffer,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Logger.prototype, "debug", null);
tslib_1.__decorate([
    Logger_1.WrapBuffer,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Logger.prototype, "verbose", null);
tslib_1.__decorate([
    Logger_1.WrapBuffer,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Logger, "error", null);
tslib_1.__decorate([
    Logger_1.WrapBuffer,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Logger, "log", null);
tslib_1.__decorate([
    Logger_1.WrapBuffer,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Logger, "warn", null);
tslib_1.__decorate([
    Logger_1.WrapBuffer,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Logger, "debug", null);
tslib_1.__decorate([
    Logger_1.WrapBuffer,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Logger, "verbose", null);
Logger = Logger_1 = tslib_1.__decorate([
    (0, injectable_decorator_1.Injectable)(),
    tslib_1.__param(0, (0, optional_decorator_1.Optional)()),
    tslib_1.__param(1, (0, optional_decorator_1.Optional)()),
    tslib_1.__metadata("design:paramtypes", [String, Object])
], Logger);
exports.Logger = Logger;
