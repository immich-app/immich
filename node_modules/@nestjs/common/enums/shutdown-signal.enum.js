"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShutdownSignal = void 0;
/**
 * System signals which shut down a process
 */
var ShutdownSignal;
(function (ShutdownSignal) {
    ShutdownSignal["SIGHUP"] = "SIGHUP";
    ShutdownSignal["SIGINT"] = "SIGINT";
    ShutdownSignal["SIGQUIT"] = "SIGQUIT";
    ShutdownSignal["SIGILL"] = "SIGILL";
    ShutdownSignal["SIGTRAP"] = "SIGTRAP";
    ShutdownSignal["SIGABRT"] = "SIGABRT";
    ShutdownSignal["SIGBUS"] = "SIGBUS";
    ShutdownSignal["SIGFPE"] = "SIGFPE";
    ShutdownSignal["SIGSEGV"] = "SIGSEGV";
    ShutdownSignal["SIGUSR2"] = "SIGUSR2";
    ShutdownSignal["SIGTERM"] = "SIGTERM";
})(ShutdownSignal = exports.ShutdownSignal || (exports.ShutdownSignal = {}));
