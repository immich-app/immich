const { Writable } = require('stream');
const chalk = require('chalk');
const { createMockInstance } = require('jest-create-mock-instance');
const Logger = require('./logger');

let outputStream;
beforeEach(() => {
    outputStream = createMockInstance(Writable);
    // Force chalk to use colours, otherwise tests may pass when they were supposed to be failing.
    chalk.level = 3;
});

const createLogger = options => {
    const logger = new Logger(Object.assign({ outputStream }, options));
    jest.spyOn(logger, 'log');
    return logger;
};

describe('#log()', () => {
    it('writes prefix + text to the output stream', () => {
        const logger = new Logger({ outputStream });
        logger.log('foo', 'bar');

        expect(outputStream.write).toHaveBeenCalledTimes(2);
        expect(outputStream.write).toHaveBeenCalledWith('foo');
        expect(outputStream.write).toHaveBeenCalledWith('bar');
    });

    it('writes multiple lines of text with prefix on each', () => {
        const logger = new Logger({ outputStream });
        logger.log('foo', 'bar\nbaz\n');

        expect(outputStream.write).toHaveBeenCalledTimes(2);
        expect(outputStream.write).toHaveBeenCalledWith('foo');
        expect(outputStream.write).toHaveBeenCalledWith('bar\nfoobaz\n');
    });

    it('does not prepend prefix if last call did not finish with a LF', () => {
        const logger = new Logger({ outputStream });
        logger.log('foo', 'bar');
        outputStream.write.mockClear();
        logger.log('foo', 'baz');

        expect(outputStream.write).toHaveBeenCalledTimes(1);
        expect(outputStream.write).toHaveBeenCalledWith('baz');
    });

    it('does not prepend prefix or handle text if logger is in raw mode', () => {
        const logger = new Logger({ outputStream, raw: true });
        logger.log('foo', 'bar\nbaz\n');

        expect(outputStream.write).toHaveBeenCalledTimes(1);
        expect(outputStream.write).toHaveBeenCalledWith('bar\nbaz\n');
    });
});

describe('#logGlobalEvent()', () => {
    it('does nothing if in raw mode', () => {
        const logger = createLogger({ raw: true });
        logger.logGlobalEvent('foo');

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('logs in gray dim style with arrow prefix', () => {
        const logger = createLogger();
        logger.logGlobalEvent('foo');

        expect(logger.log).toHaveBeenCalledWith(
            chalk.reset('-->') + ' ',
            chalk.reset('foo') + '\n'
        );
    });
});

describe('#logCommandText()', () => {
    it('logs with name if no prefixFormat is set', () => {
        const logger = createLogger();
        logger.logCommandText('foo', { name: 'bla' });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset('[bla]') + ' ', 'foo');
    });

    it('logs with index if no prefixFormat is set, and command has no name', () => {
        const logger = createLogger();
        logger.logCommandText('foo', { index: 2 });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset('[2]') + ' ', 'foo');
    });

    it('logs with prefixFormat set to pid', () => {
        const logger = createLogger({ prefixFormat: 'pid' });
        logger.logCommandText('foo', {
            pid: 123,
            info: {}
        });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset('[123]') + ' ', 'foo');
    });

    it('logs with prefixFormat set to name', () => {
        const logger = createLogger({ prefixFormat: 'name' });
        logger.logCommandText('foo', { name: 'bar' });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset('[bar]') + ' ', 'foo');
    });

    it('logs with prefixFormat set to index', () => {
        const logger = createLogger({ prefixFormat: 'index' });
        logger.logCommandText('foo', { index: 3 });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset('[3]') + ' ', 'foo');
    });

    it('logs with prefixFormat set to time (with timestampFormat)', () => {
        const logger = createLogger({ prefixFormat: 'time', timestampFormat: 'yyyy' });
        logger.logCommandText('foo', {});

        const year = new Date().getFullYear();
        expect(logger.log).toHaveBeenCalledWith(chalk.reset(`[${year}]`) + ' ', 'foo');
    });

    it('logs with templated prefixFormat', () => {
        const logger = createLogger({ prefixFormat: '{index}-{name}' });
        logger.logCommandText('foo', { index: 0, name: 'bar' });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset('0-bar') + ' ', 'foo');
    });

    it('does not strip spaces from beginning or end of prefixFormat', () => {
        const logger = createLogger({ prefixFormat: ' {index}-{name} ' });
        logger.logCommandText('foo', { index: 0, name: 'bar' });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset(' 0-bar ') + ' ', 'foo');
    });

    it('logs with no prefix', () => {
        const logger = createLogger({ prefixFormat: 'none' });
        logger.logCommandText('foo', { command: 'echo foo' });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset(''), 'foo');
    });

    it('logs prefix using command line itself', () => {
        const logger = createLogger({ prefixFormat: 'command' });
        logger.logCommandText('foo', { command: 'echo foo' });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset('[echo foo]') + ' ', 'foo');
    });

    it('logs prefix using command line itself, capped at prefixLength bytes', () => {
        const logger = createLogger({ prefixFormat: 'command', prefixLength: 6 });
        logger.logCommandText('foo', { command: 'echo foo' });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset('[ec..oo]') + ' ', 'foo');
    });

    it('logs prefix using prefixColor from command', () => {
        const logger = createLogger();
        logger.logCommandText('foo', { prefixColor: 'blue', index: 1 });

        expect(logger.log).toHaveBeenCalledWith(chalk.blue('[1]') + ' ', 'foo');
    });

    it('logs prefix in gray dim if prefixColor from command does not exist', () => {
        const logger = createLogger();
        logger.logCommandText('foo', { prefixColor: 'blue.fake', index: 1 });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset('[1]') + ' ', 'foo');
    });

    it('logs prefix using prefixColor from command if prefixColor is a hex value', () => {
        const logger = createLogger();
        const prefixColor = '#32bd8a';
        logger.logCommandText('foo', {prefixColor, index: 1});

        expect(logger.log).toHaveBeenCalledWith(chalk.hex(prefixColor)('[1]') + ' ', 'foo');
    });

    it('does nothing if command is hidden by name', () => {
        const logger = createLogger({ hide: ['abc'] });
        logger.logCommandText('foo', { name: 'abc' });

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('does nothing if command is hidden by index', () => {
        const logger = createLogger({ hide: [3] });
        logger.logCommandText('foo', { index: 3 });

        expect(logger.log).not.toHaveBeenCalled();
    });
});

describe('#logCommandEvent()', () => {
    it('does nothing if in raw mode', () => {
        const logger = createLogger({ raw: true });
        logger.logCommandEvent('foo');

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('does nothing if command is hidden by name', () => {
        const logger = createLogger({ hide: ['abc'] });
        logger.logCommandEvent('foo', { name: 'abc' });

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('does nothing if command is hidden by index', () => {
        const logger = createLogger({ hide: [3] });
        logger.logCommandEvent('foo', { index: 3 });

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('logs text in gray dim', () => {
        const logger = createLogger();
        logger.logCommandEvent('foo', { index: 1 });

        expect(logger.log).toHaveBeenCalledWith(chalk.reset('[1]') + ' ', chalk.reset('foo') + '\n');
    });
});

describe('#logTable()', () => {
    it('does not log anything in raw mode', () => {
        const logger = createLogger({ raw: true });
        logger.logTable([{ foo: 1, bar: 2 }]);

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('does not log anything if value is not an array', () => {
        const logger = createLogger();
        logger.logTable({});
        logger.logTable(null);
        logger.logTable(0);
        logger.logTable('');

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('does not log anything if array is empy', () => {
        const logger = createLogger();
        logger.logTable([]);

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('does not log anything if array items have no properties', () => {
        const logger = createLogger();
        logger.logTable([{}]);

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('logs a header for each item\'s properties', () => {
        const logger = createLogger();
        logger.logTable([{ foo: 1, bar: 2 }]);

        expect(logger.log).toHaveBeenCalledWith(
            chalk.reset('-->') + ' ',
            chalk.reset('│ foo │ bar │') + '\n',
        );
    });

    it('logs padded headers according to longest column\'s value', () => {
        const logger = createLogger();
        logger.logTable([{ a: 'foo', b: 'barbaz' }]);

        expect(logger.log).toHaveBeenCalledWith(
            chalk.reset('-->') + ' ',
            chalk.reset('│ a   │ b      │') + '\n',
        );
    });

    it('logs each items\'s values', () => {
        const logger = createLogger();
        logger.logTable([{ foo: 123 }, { foo: 456 }]);

        expect(logger.log).toHaveBeenCalledWith(
            chalk.reset('-->') + ' ',
            chalk.reset('│ 123 │') + '\n',
        );
        expect(logger.log).toHaveBeenCalledWith(
            chalk.reset('-->') + ' ',
            chalk.reset('│ 456 │') + '\n',
        );
    });

    it('logs each items\'s values padded according to longest column\'s value', () => {
        const logger = createLogger();
        logger.logTable([{ foo: 1 }, { foo: 123 }]);

        expect(logger.log).toHaveBeenCalledWith(
            chalk.reset('-->') + ' ',
            chalk.reset('│ 1   │') + '\n',
        );
    });

    it('logs items with different properties in each', () => {
        const logger = createLogger();
        logger.logTable([{ foo: 1 }, { bar: 2 }]);

        expect(logger.log).toHaveBeenCalledWith(
            chalk.reset('-->') + ' ',
            chalk.reset('│ foo │ bar │') + '\n',
        );
        expect(logger.log).toHaveBeenCalledWith(
            chalk.reset('-->') + ' ',
            chalk.reset('│ 1   │     │') + '\n',
        );
        expect(logger.log).toHaveBeenCalledWith(
            chalk.reset('-->') + ' ',
            chalk.reset('│     │ 2   │') + '\n',
        );
    });
});
