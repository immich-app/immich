"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_FILTER = exports.APP_GUARD = exports.APP_PIPE = exports.APP_INTERCEPTOR = exports.MESSAGES = void 0;
exports.MESSAGES = {
    APPLICATION_START: `Starting Nest application...`,
    APPLICATION_READY: `Nest application successfully started`,
    MICROSERVICE_READY: `Nest microservice successfully started`,
    UNKNOWN_EXCEPTION_MESSAGE: 'Internal server error',
    ERROR_DURING_SHUTDOWN: 'Error happened during shutdown',
    CALL_LISTEN_FIRST: 'app.listen() needs to be called before calling app.getUrl()',
};
exports.APP_INTERCEPTOR = 'APP_INTERCEPTOR';
exports.APP_PIPE = 'APP_PIPE';
exports.APP_GUARD = 'APP_GUARD';
exports.APP_FILTER = 'APP_FILTER';
