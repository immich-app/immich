const InputHandler = require('./src/flow-control/input-handler');
const KillOnSignal = require('./src/flow-control/kill-on-signal');
const KillOthers = require('./src/flow-control/kill-others');
const LogError = require('./src/flow-control/log-error');
const LogExit = require('./src/flow-control/log-exit');
const LogOutput = require('./src/flow-control/log-output');
const RestartProcess = require('./src/flow-control/restart-process');

const concurrently = require('./src/concurrently');
const Logger = require('./src/logger');
const LogTimings = require( './src/flow-control/log-timings' );

module.exports = exports = (commands, options = {}) => {
    const logger = new Logger({
        hide: options.hide,
        outputStream: options.outputStream || process.stdout,
        prefixFormat: options.prefix,
        prefixLength: options.prefixLength,
        raw: options.raw,
        timestampFormat: options.timestampFormat,
    });

    return concurrently(commands, {
        maxProcesses: options.maxProcesses,
        raw: options.raw,
        successCondition: options.successCondition,
        cwd: options.cwd,
        controllers: [
            new LogError({ logger }),
            new LogOutput({ logger }),
            new LogExit({ logger }),
            new InputHandler({
                logger,
                defaultInputTarget: options.defaultInputTarget,
                inputStream: options.inputStream || (options.handleInput && process.stdin),
                pauseInputStreamOnFinish: options.pauseInputStreamOnFinish,
            }),
            new KillOnSignal({ process }),
            new RestartProcess({
                logger,
                delay: options.restartDelay,
                tries: options.restartTries,
            }),
            new KillOthers({
                logger,
                conditions: options.killOthers
            }),
            new LogTimings({
                logger: options.timings ? logger: null,
                timestampFormat: options.timestampFormat,
            })
        ],
        prefixColors: options.prefixColors || [],
        timings: options.timings
    });
};

// Export all flow controllers and the main concurrently function,
// so that 3rd-parties can use them however they want
exports.concurrently = concurrently;
exports.Logger = Logger;
exports.InputHandler = InputHandler;
exports.KillOnSignal = KillOnSignal;
exports.KillOthers = KillOthers;
exports.LogError = LogError;
exports.LogExit = LogExit;
exports.LogOutput = LogOutput;
exports.RestartProcess = RestartProcess;
exports.LogTimings = LogTimings;
