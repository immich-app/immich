const { TestScheduler } = require('rxjs/testing');

const createFakeCommand = require('./flow-control/fixtures/fake-command');
const CompletionListener = require('./completion-listener');

let commands, scheduler;
beforeEach(() => {
    commands = [createFakeCommand('foo'), createFakeCommand('bar')];
    scheduler = new TestScheduler();
});

const createController = successCondition =>
    new CompletionListener({
        successCondition,
        scheduler
    });

describe('with default success condition set', () => {
    it('succeeds if all processes exited with code 0', () => {
        const result = createController().listen(commands);

        commands[0].close.next({ exitCode: 0 });
        commands[1].close.next({ exitCode: 0 });

        scheduler.flush();

        return expect(result).resolves.toEqual([{ exitCode: 0 }, { exitCode: 0 }]);
    });

    it('fails if one of the processes exited with non-0 code', () => {
        const result = createController().listen(commands);

        commands[0].close.next({ exitCode: 0 });
        commands[1].close.next({ exitCode: 1 });

        scheduler.flush();

        expect(result).rejects.toEqual([{ exitCode: 0 }, { exitCode: 1 }]);
    });
});

describe('with success condition set to first', () => {
    it('succeeds if first process to exit has code 0', () => {
        const result = createController('first').listen(commands);

        commands[1].close.next({ exitCode: 0 });
        commands[0].close.next({ exitCode: 1 });

        scheduler.flush();

        return expect(result).resolves.toEqual([{ exitCode: 0 }, { exitCode: 1 }]);
    });

    it('fails if first process to exit has non-0 code', () => {
        const result = createController('first').listen(commands);

        commands[1].close.next({ exitCode: 1 });
        commands[0].close.next({ exitCode: 0 });

        scheduler.flush();

        return expect(result).rejects.toEqual([{ exitCode: 1 }, { exitCode: 0 }]);
    });
});

describe('with success condition set to last', () => {
    it('succeeds if last process to exit has code 0', () => {
        const result = createController('last').listen(commands);

        commands[1].close.next({ exitCode: 1 });
        commands[0].close.next({ exitCode: 0 });

        scheduler.flush();

        return expect(result).resolves.toEqual([{ exitCode: 1 }, { exitCode: 0 }]);
    });

    it('fails if last process to exit has non-0 code', () => {
        const result = createController('last').listen(commands);

        commands[1].close.next({ exitCode: 0 });
        commands[0].close.next({ exitCode: 1 });

        scheduler.flush();

        return expect(result).rejects.toEqual([{ exitCode: 0 }, { exitCode: 1 }]);
    });

});
