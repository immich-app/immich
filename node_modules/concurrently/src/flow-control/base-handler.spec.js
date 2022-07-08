const stream = require('stream');
const { createMockInstance } = require('jest-create-mock-instance');

const Logger = require('../logger');
const createFakeCommand = require('./fixtures/fake-command');
const BaseHandler = require('./base-handler');

let commands, controller, inputStream, logger;

beforeEach(() => {
    commands = [
        createFakeCommand('foo', 'echo foo', 0),
        createFakeCommand('bar', 'echo bar', 1),
    ];
    inputStream = new stream.PassThrough();
    logger = createMockInstance(Logger);
    controller = new BaseHandler({ logger });
});

it('returns same commands and null onFinish callback by default', () => {
    expect(controller.handle(commands)).toMatchObject({ commands, onFinish: null });
});