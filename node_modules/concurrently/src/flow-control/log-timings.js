const formatDate = require('date-fns/format');
const Rx = require('rxjs');
const { bufferCount, take } = require('rxjs/operators');
const _ = require('lodash');
const BaseHandler = require('./base-handler');

module.exports = class LogTimings extends BaseHandler {
    constructor({ logger, timestampFormat }) {
        super({ logger });

        this.timestampFormat = timestampFormat;
    }

    printExitInfoTimingTable(exitInfos) {
        const exitInfoTable = _(exitInfos)
            .sortBy(({ timings }) => timings.durationSeconds)
            .reverse()
            .map(({ command, timings, killed, exitCode }) => {
                const readableDurationMs = (timings.endDate - timings.startDate).toLocaleString();
                return {
                    name: command.name,
                    duration: `${readableDurationMs}ms`,
                    'exit code': exitCode,
                    killed,
                    command: command.command,
                };
            })
            .value();

        this.logger.logGlobalEvent('Timings:');
        this.logger.logTable(exitInfoTable);
        return exitInfos;
    };

    handle(commands) {
        if (!this.logger) {
            return { commands };
        }

        // individual process timings
        commands.forEach(command => {
            command.timer.subscribe(({ startDate, endDate }) => {
                if (!endDate) {
                    const formattedStartDate = formatDate(startDate, this.timestampFormat);
                    this.logger.logCommandEvent(`${command.command} started at ${formattedStartDate}`, command);
                } else {
                    const durationMs = endDate.getTime() - startDate.getTime();
                    const formattedEndDate = formatDate(endDate, this.timestampFormat);
                    this.logger.logCommandEvent(`${command.command} stopped at ${formattedEndDate} after ${durationMs.toLocaleString()}ms`, command);
                }
            });
        });

        // overall summary timings
        const closeStreams = commands.map(command => command.close);
        this.allProcessesClosed = Rx.merge(...closeStreams).pipe(
            bufferCount(closeStreams.length),
            take(1),
        );
        this.allProcessesClosed.subscribe((exitInfos) => this.printExitInfoTimingTable(exitInfos));

        return { commands };
    }
};
