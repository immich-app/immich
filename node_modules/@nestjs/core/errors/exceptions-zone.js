"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExceptionsZone = void 0;
const common_1 = require("@nestjs/common");
const exception_handler_1 = require("./exception-handler");
const DEFAULT_TEARDOWN = () => process.exit(1);
class ExceptionsZone {
    static run(callback, teardown = DEFAULT_TEARDOWN, autoFlushLogs) {
        try {
            callback();
        }
        catch (e) {
            this.exceptionHandler.handle(e);
            if (autoFlushLogs) {
                common_1.Logger.flush();
            }
            teardown(e);
        }
    }
    static async asyncRun(callback, teardown = DEFAULT_TEARDOWN, autoFlushLogs) {
        try {
            await callback();
        }
        catch (e) {
            this.exceptionHandler.handle(e);
            if (autoFlushLogs) {
                common_1.Logger.flush();
            }
            teardown(e);
        }
    }
}
exports.ExceptionsZone = ExceptionsZone;
ExceptionsZone.exceptionHandler = new exception_handler_1.ExceptionHandler();
