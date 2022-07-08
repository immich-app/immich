const EventEmitter = require('events');
const process = require('process');
const Command = require('./command');

const createProcess = () => {
    const process = new EventEmitter();
    process.pid = 1;
    return process;
};

const createProcessWithIO = () => {
    const process = createProcess();
    return Object.assign(process, {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
        stdin: new EventEmitter()
    });
};

describe('#start()', () => {
    it('spawns process with given command and options', () => {
        const spawn = jest.fn().mockReturnValue(createProcess());
        const command = new Command({
            spawn,
            spawnOpts: { bla: true },
            command: 'echo foo',
        });
        command.start();

        expect(spawn).toHaveBeenCalledTimes(1);
        expect(spawn).toHaveBeenCalledWith(command.command, { bla: true });
    });

    it('sets stdin, process and PID', () => {
        const process = createProcessWithIO();
        const command = new Command({ spawn: () => process });

        command.start();
        expect(command.process).toBe(process);
        expect(command.pid).toBe(process.pid);
        expect(command.stdin).toBe(process.stdin);
    });

    it('shares errors to the error stream', done => {
        const process = createProcess();
        const command = new Command({ spawn: () => process });

        command.error.subscribe(data => {
            expect(data).toBe('foo');
            expect(command.process).toBeUndefined();
            done();
        });

        command.start();
        process.emit('error', 'foo');
    });

    it('shares start and close timing events to the timing stream', done => {
        const process = createProcess();
        const command = new Command({ spawn: () => process });

        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 1000);
        jest.spyOn(Date, 'now')
            .mockReturnValueOnce(startDate.getTime())
            .mockReturnValueOnce(endDate.getTime());

        let callCount = 0;
        command.timer.subscribe(({startDate: actualStartDate, endDate: actualEndDate}) => {
            switch (callCount) {
            case 0:
                expect(actualStartDate).toStrictEqual(startDate);
                expect(actualEndDate).toBeUndefined();
                break;
            case 1:
                expect(actualStartDate).toStrictEqual(startDate);
                expect(actualEndDate).toStrictEqual(endDate);
                done();
                break;
            default:
                throw new Error('Unexpected call count');
            }
            callCount++;
        });

        command.start();
        process.emit('close', 0, null);

    });

    it('shares start and error timing events to the timing stream', done => {
        const process = createProcess();
        const command = new Command({ spawn: () => process });

        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 1000);
        jest.spyOn(Date, 'now')
            .mockReturnValueOnce(startDate.getTime())
            .mockReturnValueOnce(endDate.getTime());

        let callCount = 0;
        command.timer.subscribe(({startDate: actualStartDate, endDate: actualEndDate}) => {
            switch (callCount) {
            case 0:
                expect(actualStartDate).toStrictEqual(startDate);
                expect(actualEndDate).toBeUndefined();
                break;
            case 1:
                expect(actualStartDate).toStrictEqual(startDate);
                expect(actualEndDate).toStrictEqual(endDate);
                done();
                break;
            default:
                throw new Error('Unexpected call count');
            }
            callCount++;
        });

        command.start();
        process.emit('error', 0, null);

    });

    it('shares closes to the close stream with exit code', done => {
        const process = createProcess();
        const command = new Command({ spawn: () => process });

        command.close.subscribe(data => {
            expect(data.exitCode).toBe(0);
            expect(data.killed).toBe(false);
            expect(command.process).toBeUndefined();
            done();
        });

        command.start();
        process.emit('close', 0, null);
    });

    it('shares closes to the close stream with signal', done => {
        const process = createProcess();
        const command = new Command({ spawn: () => process });

        command.close.subscribe(data => {
            expect(data.exitCode).toBe('SIGKILL');
            expect(data.killed).toBe(false);
            done();
        });

        command.start();
        process.emit('close', null, 'SIGKILL');
    });

    it('shares closes to the close stream with timing information', done => {
        const process1 = createProcess();
        const command = new Command({ spawn: () => process1 });

        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 1000);
        jest.spyOn(Date, 'now')
            .mockReturnValueOnce(startDate.getTime())
            .mockReturnValueOnce(endDate.getTime());

        jest.spyOn(process, 'hrtime')
            .mockReturnValueOnce([0, 0])
            .mockReturnValueOnce([1, 1e8]);

        command.close.subscribe(data => {
            expect(data.timings.startDate).toStrictEqual(startDate);
            expect(data.timings.endDate).toStrictEqual(endDate);
            expect(data.timings.durationSeconds).toBe(1.1);
            done();
        });

        command.start();
        process1.emit('close', null, 'SIGKILL');
    });

    it('shares closes to the close stream with command info and index', done => {
        const process = createProcess();
        const commandInfo = {
            command: 'cmd',
            name: 'name',
            prefixColor: 'green',
            env: { VAR: 'yes' },
        };
        const command = new Command(
            Object.assign({
                index: 1,
                spawn: () => process
            }, commandInfo)
        );

        command.close.subscribe(data => {
            expect(data.command).toEqual(commandInfo);
            expect(data.killed).toBe(false);
            expect(data.index).toBe(1);
            done();
        });

        command.start();
        process.emit('close', 0, null);
    });

    it('shares stdout to the stdout stream', done => {
        const process = createProcessWithIO();
        const command = new Command({ spawn: () => process });

        command.stdout.subscribe(data => {
            expect(data.toString()).toBe('hello');
            done();
        });

        command.start();
        process.stdout.emit('data', Buffer.from('hello'));
    });

    it('shares stderr to the stdout stream', done => {
        const process = createProcessWithIO();
        const command = new Command({ spawn: () => process });

        command.stderr.subscribe(data => {
            expect(data.toString()).toBe('dang');
            done();
        });

        command.start();
        process.stderr.emit('data', Buffer.from('dang'));
    });
});

describe('#kill()', () => {
    let process, killProcess, command;
    beforeEach(() => {
        process = createProcess();
        killProcess = jest.fn();
        command = new Command({ spawn: () => process, killProcess });
    });

    it('kills process', () => {
        command.start();
        command.kill();

        expect(killProcess).toHaveBeenCalledTimes(1);
        expect(killProcess).toHaveBeenCalledWith(command.pid, undefined);
    });

    it('kills process with some signal', () => {
        command.start();
        command.kill('SIGKILL');

        expect(killProcess).toHaveBeenCalledTimes(1);
        expect(killProcess).toHaveBeenCalledWith(command.pid, 'SIGKILL');
    });

    it('does not try to kill inexistent process', () => {
        command.start();
        process.emit('error');
        command.kill();

        expect(killProcess).not.toHaveBeenCalled();
    });

    it('marks the command as killed', done => {
        command.start();

        command.close.subscribe(data => {
            expect(data.exitCode).toBe(1);
            expect(data.killed).toBe(true);
            done();
        });

        command.kill();
        process.emit('close', 1, null);
    });
});
