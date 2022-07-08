const { createMockInstance } = require('jest-create-mock-instance');
const formatDate = require('date-fns/format');
const Logger = require('../logger');
const LogTimings = require( './log-timings' );
const createFakeCommand = require('./fixtures/fake-command');

// shown in timing order
const startDate0 = new Date();
const startDate1 = new Date(startDate0.getTime() + 1000);
const endDate1 = new Date(startDate0.getTime() + 3000);
const endDate0 = new Date(startDate0.getTime() + 5000);

const timestampFormat = 'yyyy-MM-dd HH:mm:ss.SSS';
const getDurationText = (startDate, endDate) => `${(endDate.getTime() - startDate.getTime()).toLocaleString()}ms`;
const command0DurationTextMs = getDurationText(startDate0, endDate0);
const command1DurationTextMs = getDurationText(startDate1, endDate1);

const exitInfoToTimingInfo = ({ command, timings, killed, exitCode }) => {
    const readableDurationMs = getDurationText(timings.startDate, timings.endDate);
    return {
        name: command.name,
        duration: readableDurationMs,
        'exit code': exitCode,
        killed,
        command: command.command,
    };
};

let controller, logger, commands, command0ExitInfo, command1ExitInfo;

beforeEach(() => {
    commands = [
        createFakeCommand('foo', 'command 1', 0),
        createFakeCommand('bar', 'command 2', 1),
    ];

    command0ExitInfo = {
        command: commands[0].command,
        timings: {
            startDate: startDate0,
            endDate: endDate0,
        },
        index: commands[0].index,
        killed: false,
        exitCode: 0,
    };

    command1ExitInfo = {
        command: commands[1].command,
        timings: {
            startDate: startDate1,
            endDate: endDate1,
        },
        index: commands[1].index,
        killed: false,
        exitCode: 0,
    };

    logger = createMockInstance(Logger);
    controller = new LogTimings({ logger, timestampFormat });
});

it('returns same commands', () => {
    expect(controller.handle(commands)).toMatchObject({ commands });
});

it('does not log timings and doesn\'t throw if no logger is provided', () => {
    controller = new LogTimings({  });
    controller.handle(commands);

    commands[0].timer.next({ startDate: startDate0 });
    commands[1].timer.next({ startDate: startDate1 });
    commands[1].timer.next({ startDate: startDate1, endDate: endDate1 });
    commands[0].timer.next({ startDate: startDate0, endDate: endDate0 });

    expect(logger.logCommandEvent).toHaveBeenCalledTimes(0);
});

it('logs the timings at the start and end (ie complete or error) event of each command', () => {
    controller.handle(commands);

    commands[0].timer.next({ startDate: startDate0 });
    commands[1].timer.next({ startDate: startDate1 });
    commands[1].timer.next({ startDate: startDate1, endDate: endDate1 });
    commands[0].timer.next({ startDate: startDate0, endDate: endDate0 });

    expect(logger.logCommandEvent).toHaveBeenCalledTimes(4);
    expect(logger.logCommandEvent).toHaveBeenCalledWith(
        `${commands[0].command} started at ${formatDate(startDate0, timestampFormat)}`,
        commands[0]
    );
    expect(logger.logCommandEvent).toHaveBeenCalledWith(
        `${commands[1].command} started at ${formatDate(startDate1, timestampFormat)}`,
        commands[1]
    );
    expect(logger.logCommandEvent).toHaveBeenCalledWith(
        `${commands[1].command} stopped at ${formatDate(endDate1, timestampFormat)} after ${command1DurationTextMs}`,
        commands[1]
    );
    expect(logger.logCommandEvent).toHaveBeenCalledWith(
        `${commands[0].command} stopped at ${formatDate(endDate0, timestampFormat)} after ${command0DurationTextMs}`,
        commands[0]
    );
});

it('does not log timings summary if there was an error', () => {
    controller.handle(commands);

    commands[0].close.next(command0ExitInfo);
    commands[1].error.next();

    expect(logger.logTable).toHaveBeenCalledTimes(0);

});

it('logs the sorted timings summary when all processes close successfully', () => {
    jest.spyOn(controller, 'printExitInfoTimingTable');
    controller.handle(commands);

    commands[0].close.next(command0ExitInfo);
    commands[1].close.next(command1ExitInfo);

    expect(logger.logTable).toHaveBeenCalledTimes(1);

    // un-sorted ie by finish order
    expect(controller.printExitInfoTimingTable).toHaveBeenCalledWith([
        command0ExitInfo,
        command1ExitInfo
    ]);

    // sorted by duration
    expect(logger.logTable).toHaveBeenCalledWith([
        exitInfoToTimingInfo(command1ExitInfo),
        exitInfoToTimingInfo(command0ExitInfo)
    ]);

});
