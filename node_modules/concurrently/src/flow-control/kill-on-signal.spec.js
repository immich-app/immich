const EventEmitter = require('events');

const createFakeCommand = require('./fixtures/fake-command');
const KillOnSignal = require('./kill-on-signal');

let commands, controller, process;
beforeEach(() => {
    process = new EventEmitter();
    commands = [
        createFakeCommand(),
        createFakeCommand(),
    ];
    controller = new KillOnSignal({ process });
});

it('returns commands that keep non-close streams from original commands', () => {
    const { commands: newCommands } = controller.handle(commands);
    newCommands.forEach((newCommand, i) => {
        expect(newCommand.close).not.toBe(commands[i].close);
        expect(newCommand.error).toBe(commands[i].error);
        expect(newCommand.stdout).toBe(commands[i].stdout);
        expect(newCommand.stderr).toBe(commands[i].stderr);
    });
});

it('returns commands that map SIGINT to exit code 0', () => {
    const { commands: newCommands } = controller.handle(commands);
    expect(newCommands).not.toBe(commands);
    expect(newCommands).toHaveLength(commands.length);

    const callback = jest.fn();
    newCommands[0].close.subscribe(callback);
    process.emit('SIGINT');

    // A fake command's .kill() call won't trigger a close event automatically...
    commands[0].close.next({ exitCode: 1 });

    expect(callback).not.toHaveBeenCalledWith({ exitCode: 'SIGINT' });
    expect(callback).toHaveBeenCalledWith({ exitCode: 0 });
});

it('returns commands that keep non-SIGINT exit codes', () => {
    const { commands: newCommands } = controller.handle(commands);
    expect(newCommands).not.toBe(commands);
    expect(newCommands).toHaveLength(commands.length);

    const callback = jest.fn();
    newCommands[0].close.subscribe(callback);
    commands[0].close.next({ exitCode: 1 });

    expect(callback).toHaveBeenCalledWith({ exitCode: 1 });
});

it('kills all commands on SIGINT', () => {
    controller.handle(commands);
    process.emit('SIGINT');

    expect(process.listenerCount('SIGINT')).toBe(1);
    expect(commands[0].kill).toHaveBeenCalledWith('SIGINT');
    expect(commands[1].kill).toHaveBeenCalledWith('SIGINT');
});

it('kills all commands on SIGTERM', () => {
    controller.handle(commands);
    process.emit('SIGTERM');

    expect(process.listenerCount('SIGTERM')).toBe(1);
    expect(commands[0].kill).toHaveBeenCalledWith('SIGTERM');
    expect(commands[1].kill).toHaveBeenCalledWith('SIGTERM');
});

it('kills all commands on SIGHUP', () => {
    controller.handle(commands);
    process.emit('SIGHUP');

    expect(process.listenerCount('SIGHUP')).toBe(1);
    expect(commands[0].kill).toHaveBeenCalledWith('SIGHUP');
    expect(commands[1].kill).toHaveBeenCalledWith('SIGHUP');
});
