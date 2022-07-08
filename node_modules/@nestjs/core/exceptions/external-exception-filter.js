"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
class ExternalExceptionFilter {
    catch(exception, host) {
        if (exception instanceof Error && !(exception instanceof common_1.HttpException)) {
            ExternalExceptionFilter.logger.error(exception.message, exception.stack);
        }
        throw exception;
    }
}
exports.ExternalExceptionFilter = ExternalExceptionFilter;
ExternalExceptionFilter.logger = new common_1.Logger('ExceptionsHandler');
