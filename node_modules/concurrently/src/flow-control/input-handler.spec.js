const stream = require('stream');
const { createMockInstance } = require('jest-create-mock-instance');

const Logger = require('../logger');
const createFakeCommand = require('./fixtures/fake-command');
const InputHandler = require('./input-handler');

let commands, controller, inputStream, logger;

beforeEach(() => {
    commands = [
        createFakeCommand('foo', 'echo foo', 0),
        createFakeCommand('bar', 'echo bar', 1),
    ];
    inputStream = new stream.PassThrough();
    logger = createMockInstance(Logger);
    controller = new InputHandler({
        defaultInputTarget: 0,
        inputStream,
        logger
    });
});

it('returns same commands', () => {
    expect(controller.handle(commands)).toMatchObject({ commands });

    controller = new InputHandler({ logger });
    expect(controller.handle(commands)).toMatchObject({ commands });
});

it('forwards input stream to default target ID', () => {
    controller.handle(commands);

    inputStream.write('something');

    expect(commands[0].stdin.write).toHaveBeenCalledTimes(1);
    expect(commands[0].stdin.write).toHaveBeenCalledWith('something');
    expect(commands[1].stdin.write).not.toHaveBeenCalled();
});

it('forwards input stream to target index specified in input', () => {
    controller.handle(commands);

    inputStream.write('1:something');

    expect(commands[0].stdin.write).not.toHaveBeenCalled();
    expect(commands[1].stdin.write).toHaveBeenCalledTimes(1);
    expect(commands[1].stdin.write).toHaveBeenCalledWith('something');
});

it('forwards input stream to target index specified in input when input contains colon', () => {
    controller.handle(commands);

    inputStream.emit('data', Buffer.from('1::something'));
    inputStream.emit('data', Buffer.from('1:some:thing'));

    expect(commands[0].stdin.write).not.toHaveBeenCalled();
    expect(commands[1].stdin.write).toHaveBeenCalledTimes(2);
    expect(commands[1].stdin.write).toHaveBeenCalledWith(':something');
    expect(commands[1].stdin.write).toHaveBeenCalledWith('some:thing');
});

it('forwards input stream to target name specified in input', () => {
    controller.handle(commands);

    inputStream.write('bar:something');

    expect(commands[0].stdin.write).not.toHaveBeenCalled();
    expect(commands[1].stdin.write).toHaveBeenCalledTimes(1);
    expect(commands[1].stdin.write).toHaveBeenCalledWith('something');
});

it('logs error if command has no stdin open', () => {
    commands[0].stdin = null;
    controller.handle(commands);

    inputStream.write('something');

    expect(commands[1].stdin.write).not.toHaveBeenCalled();
    expect(logger.logGlobalEvent).toHaveBeenCalledWith('Unable to find command 0, or it has no stdin open\n');
});

it('logs error if command is not found', () => {
    controller.handle(commands);

    inputStream.write('foobar:something');

    expect(commands[0].stdin.write).not.toHaveBeenCalled();
    expect(commands[1].stdin.write).not.toHaveBeenCalled();
    expect(logger.logGlobalEvent).toHaveBeenCalledWith('Unable to find command foobar, or it has no stdin open\n');
});

it('pauses input stream when finished', () => {
    expect(inputStream.readableFlowing).toBeNull();

    const { onFinish } = controller.handle(commands);
    expect(inputStream.readableFlowing).toBe(true);

    onFinish();
    expect(inputStream.readableFlowing).toBe(false);
});

it('does not pause input stream when pauseInputStreamOnFinish is set to false', () => {
    controller = new InputHandler({ inputStream, pauseInputStreamOnFinish: false });

    expect(inputStream.readableFlowing).toBeNull();

    const { onFinish } = controller.handle(commands);
    expect(inputStream.readableFlowing).toBe(true);

    onFinish();
    expect(inputStream.readableFlowing).toBe(true);
});
