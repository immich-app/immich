const { createMockInstance } = require('jest-create-mock-instance');

const Logger = require('../logger');
const createFakeCommand = require('./fixtures/fake-command');
const KillOthers = require('./kill-others');

let commands, logger;
beforeEach(() => {
    commands = [
        createFakeCommand(),
        createFakeCommand()
    ];

    logger = createMockInstance(Logger);
});

const createWithConditions = conditions => new KillOthers({
    logger,
    conditions
});

it('returns same commands', () => {
    expect(createWithConditions(['foo']).handle(commands)).toMatchObject({ commands });
    expect(createWithConditions(['failure']).handle(commands)).toMatchObject({ commands });
});

it('does not kill others if condition does not match', () => {
    createWithConditions(['failure']).handle(commands);
    commands[1].killable = true;
    commands[0].close.next({ exitCode: 0 });

    expect(logger.logGlobalEvent).not.toHaveBeenCalled();
    expect(commands[0].kill).not.toHaveBeenCalled();
    expect(commands[1].kill).not.toHaveBeenCalled();
});

it('kills other killable processes on success', () => {
    createWithConditions(['success']).handle(commands);
    commands[1].killable = true;
    commands[0].close.next({ exitCode: 0 });

    expect(logger.logGlobalEvent).toHaveBeenCalledTimes(1);
    expect(logger.logGlobalEvent).toHaveBeenCalledWith('Sending SIGTERM to other processes..');
    expect(commands[0].kill).not.toHaveBeenCalled();
    expect(commands[1].kill).toHaveBeenCalled();
});

it('kills other killable processes on failure', () => {
    createWithConditions(['failure']).handle(commands);
    commands[1].killable = true;
    commands[0].close.next({ exitCode: 1 });

    expect(logger.logGlobalEvent).toHaveBeenCalledTimes(1);
    expect(logger.logGlobalEvent).toHaveBeenCalledWith('Sending SIGTERM to other processes..');
    expect(commands[0].kill).not.toHaveBeenCalled();
    expect(commands[1].kill).toHaveBeenCalled();
});

it('does not try to kill processes already dead', () => {
    createWithConditions(['failure']).handle(commands);
    commands[0].close.next({ exitCode: 1 });

    expect(logger.logGlobalEvent).not.toHaveBeenCalled();
    expect(commands[0].kill).not.toHaveBeenCalled();
    expect(commands[1].kill).not.toHaveBeenCalled();
});
