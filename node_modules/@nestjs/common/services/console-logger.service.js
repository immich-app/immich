"use strict";
var ConsoleLogger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogger = void 0;
const tslib_1 = require("tslib");
const injectable_decorator_1 = require("../decorators/core/injectable.decorator");
const optional_decorator_1 = require("../decorators/core/optional.decorator");
const cli_colors_util_1 = require("../utils/cli-colors.util");
const shared_utils_1 = require("../utils/shared.utils");
const utils_1 = require("./utils");
const DEFAULT_LOG_LEVELS = [
    'log',
    'error',
    'warn',
    'debug',
    'verbose',
];
let ConsoleLogger = ConsoleLogger_1 = class ConsoleLogger {
    constructor(context, options = {}) {
        this.context = context;
        this.options = options;
        if (!options.logLevels) {
            options.logLevels = DEFAULT_LOG_LEVELS;
        }
        if (context) {
            this.originalContext = context;
        }
    }
    log(message, ...optionalParams) {
        if (!this.isLevelEnabled('log')) {
            return;
        }
        const { messages, context } = this.getContextAndMessagesToPrint([
            message,
            ...optionalParams,
        ]);
        this.printMessages(messages, context, 'log');
    }
    error(message, ...optionalParams) {
        if (!this.isLevelEnabled('error')) {
            return;
        }
        const { messages, context, stack } = this.getContextAndStackAndMessagesToPrint([message, ...optionalParams]);
        this.printMessages(messages, context, 'error', 'stderr');
        this.printStackTrace(stack);
    }
    warn(message, ...optionalParams) {
        if (!this.isLevelEnabled('warn')) {
            return;
        }
        const { messages, context } = this.getContextAndMessagesToPrint([
            message,
            ...optionalParams,
        ]);
        this.printMessages(messages, context, 'warn');
    }
    debug(message, ...optionalParams) {
        if (!this.isLevelEnabled('debug')) {
            return;
        }
        const { messages, context } = this.getContextAndMessagesToPrint([
            message,
            ...optionalParams,
        ]);
        this.printMessages(messages, context, 'debug');
    }
    verbose(message, ...optionalParams) {
        if (!this.isLevelEnabled('verbose')) {
            return;
        }
        const { messages, context } = this.getContextAndMessagesToPrint([
            message,
            ...optionalParams,
        ]);
        this.printMessages(messages, context, 'verbose');
    }
    /**
     * Set log levels
     * @param levels log levels
     */
    setLogLevels(levels) {
        if (!this.options) {
            this.options = {};
        }
        this.options.logLevels = levels;
    }
    /**
     * Set logger context
     * @param context context
     */
    setContext(context) {
        this.context = context;
    }
    /**
     * Resets the logger context to the value that was passed in the constructor.
     */
    resetContext() {
        this.context = this.originalContext;
    }
    isLevelEnabled(level) {
        var _a;
        const logLevels = (_a = this.options) === null || _a === void 0 ? void 0 : _a.logLevels;
        return (0, utils_1.isLogLevelEnabled)(level, logLevels);
    }
    getTimestamp() {
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
    printMessages(messages, context = '', logLevel = 'log', writeStreamType) {
        messages.forEach(message => {
            const pidMessage = this.formatPid(process.pid);
            const contextMessage = context ? (0, cli_colors_util_1.yellow)(`[${context}] `) : '';
            const timestampDiff = this.updateAndGetTimestampDiff();
            const formattedLogLevel = logLevel.toUpperCase().padStart(7, ' ');
            const formatedMessage = this.formatMessage(logLevel, message, pidMessage, formattedLogLevel, contextMessage, timestampDiff);
            process[writeStreamType !== null && writeStreamType !== void 0 ? writeStreamType : 'stdout'].write(formatedMessage);
        });
    }
    formatPid(pid) {
        return `[Nest] ${pid}  - `;
    }
    formatMessage(logLevel, message, pidMessage, formattedLogLevel, contextMessage, timestampDiff) {
        const output = this.stringifyMessage(message, logLevel);
        pidMessage = this.colorize(pidMessage, logLevel);
        formattedLogLevel = this.colorize(formattedLogLevel, logLevel);
        return `${pidMessage}${this.getTimestamp()} ${formattedLogLevel} ${contextMessage}${output}${timestampDiff}\n`;
    }
    stringifyMessage(message, logLevel) {
        return (0, shared_utils_1.isPlainObject)(message)
            ? `${this.colorize('Object:', logLevel)}\n${JSON.stringify(message, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}\n`
            : this.colorize(message, logLevel);
    }
    colorize(message, logLevel) {
        const color = this.getColorByLogLevel(logLevel);
        return color(message);
    }
    printStackTrace(stack) {
        if (!stack) {
            return;
        }
        process.stderr.write(`${stack}\n`);
    }
    updateAndGetTimestampDiff() {
        var _a;
        const includeTimestamp = ConsoleLogger_1.lastTimestampAt && ((_a = this.options) === null || _a === void 0 ? void 0 : _a.timestamp);
        const result = includeTimestamp
            ? (0, cli_colors_util_1.yellow)(` +${Date.now() - ConsoleLogger_1.lastTimestampAt}ms`)
            : '';
        ConsoleLogger_1.lastTimestampAt = Date.now();
        return result;
    }
    getContextAndMessagesToPrint(args) {
        if ((args === null || args === void 0 ? void 0 : args.length) <= 1) {
            return { messages: args, context: this.context };
        }
        const lastElement = args[args.length - 1];
        const isContext = (0, shared_utils_1.isString)(lastElement);
        if (!isContext) {
            return { messages: args, context: this.context };
        }
        return {
            context: lastElement,
            messages: args.slice(0, args.length - 1),
        };
    }
    getContextAndStackAndMessagesToPrint(args) {
        const { messages, context } = this.getContextAndMessagesToPrint(args);
        if ((messages === null || messages === void 0 ? void 0 : messages.length) <= 1) {
            return { messages, context };
        }
        const lastElement = messages[messages.length - 1];
        const isStack = (0, shared_utils_1.isString)(lastElement);
        if (!isStack) {
            return { messages, context };
        }
        return {
            stack: lastElement,
            messages: messages.slice(0, messages.length - 1),
            context,
        };
    }
    getColorByLogLevel(level) {
        switch (level) {
            case 'debug':
                return cli_colors_util_1.clc.magentaBright;
            case 'warn':
                return cli_colors_util_1.clc.yellow;
            case 'error':
                return cli_colors_util_1.clc.red;
            case 'verbose':
                return cli_colors_util_1.clc.cyanBright;
            default:
                return cli_colors_util_1.clc.green;
        }
    }
};
ConsoleLogger = ConsoleLogger_1 = tslib_1.__decorate([
    (0, injectable_decorator_1.Injectable)(),
    tslib_1.__param(0, (0, optional_decorator_1.Optional)()),
    tslib_1.__param(1, (0, optional_decorator_1.Optional)()),
    tslib_1.__metadata("design:paramtypes", [String, Object])
], ConsoleLogger);
exports.ConsoleLogger = ConsoleLogger;
