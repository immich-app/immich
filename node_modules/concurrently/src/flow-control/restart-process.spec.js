const { createMockInstance } = require('jest-create-mock-instance');
const { TestScheduler } = require('rxjs/testing');

const Logger = require('../logger');
const createFakeCommand = require('./fixtures/fake-command');
const RestartProcess = require('./restart-process');

let commands, controller, logger, scheduler;
beforeEach(() => {
    commands = [
        createFakeCommand(),
        createFakeCommand()
    ];

    logger = createMockInstance(Logger);
    scheduler = new TestScheduler();
    controller = new RestartProcess({
        logger,
        scheduler,
        delay: 100,
        tries: 2
    });
});

it('does not restart processes that complete with success', () => {
    controller.handle(commands);

    commands[0].close.next({ exitCode: 0 });
    commands[1].close.next({ exitCode: 0 });

    scheduler.flush();

    expect(commands[0].start).toHaveBeenCalledTimes(0);
    expect(commands[1].start).toHaveBeenCalledTimes(0);
});

it('restarts processes that fail after delay has passed', () => {
    controller.handle(commands);

    commands[0].close.next({ exitCode: 1 });
    commands[1].close.next({ exitCode: 0 });

    scheduler.flush();

    expect(logger.logCommandEvent).toHaveBeenCalledTimes(1);
    expect(logger.logCommandEvent).toHaveBeenCalledWith(
        `${commands[0].command} restarted`,
        commands[0]
    );
    expect(commands[0].start).toHaveBeenCalledTimes(1);
    expect(commands[1].start).not.toHaveBeenCalled();
});

it('restarts processes up to tries', () => {
    controller.handle(commands);

    commands[0].close.next({ exitCode: 1 });
    commands[0].close.next({ exitCode: 'SIGTERM' });
    commands[0].close.next({ exitCode: 'SIGTERM' });
    commands[1].close.next({ exitCode: 0 });

    scheduler.flush();

    expect(logger.logCommandEvent).toHaveBeenCalledTimes(2);
    expect(logger.logCommandEvent).toHaveBeenCalledWith(
        `${commands[0].command} restarted`,
        commands[0]
    );
    expect(commands[0].start).toHaveBeenCalledTimes(2);
});

it('restart processes forever, if tries is negative', () => {
    controller = new RestartProcess({
        logger,
        scheduler,
        delay: 100,
        tries: -1
    });
    expect(controller.tries).toBe(Infinity);
});

it('restarts processes until they succeed', () => {
    controller.handle(commands);

    commands[0].close.next({ exitCode: 1 });
    commands[0].close.next({ exitCode: 0 });
    commands[1].close.next({ exitCode: 0 });

    scheduler.flush();

    expect(logger.logCommandEvent).toHaveBeenCalledTimes(1);
    expect(logger.logCommandEvent).toHaveBeenCalledWith(
        `${commands[0].command} restarted`,
        commands[0]
    );
    expect(commands[0].start).toHaveBeenCalledTimes(1);
});

describe('returned commands', () => {
    it('are the same if 0 tries are to be attempted', () => {
        controller = new RestartProcess({ logger, scheduler });
        expect(controller.handle(commands)).toMatchObject({ commands });
    });

    it('are not the same, but with same length if 1+ tries are to be attempted', () => {
        const { commands: newCommands } = controller.handle(commands);
        expect(newCommands).not.toBe(commands);
        expect(newCommands).toHaveLength(commands.length);
    });

    it('skip close events followed by restarts', () => {
        const { commands: newCommands } = controller.handle(commands);

        const callback = jest.fn();
        newCommands[0].close.subscribe(callback);
        newCommands[1].close.subscribe(callback);

        commands[0].close.next({ exitCode: 1 });
        commands[0].close.next({ exitCode: 1 });
        commands[0].close.next({ exitCode: 1 });
        commands[1].close.next({ exitCode: 1 });
        commands[1].close.next({ exitCode: 0 });

        scheduler.flush();

        // 1 failure from commands[0], 1 success from commands[1]
        expect(callback).toHaveBeenCalledTimes(2);
    });

    it('keep non-close streams from original commands', () => {
        const { commands: newCommands } = controller.handle(commands);
        newCommands.forEach((newCommand, i) => {
            expect(newCommand.close).not.toBe(commands[i].close);
            expect(newCommand.error).toBe(commands[i].error);
            expect(newCommand.stdout).toBe(commands[i].stdout);
            expect(newCommand.stderr).toBe(commands[i].stderr);
        });
    });
});
