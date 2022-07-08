const assert = require('assert');
const _ = require('lodash');
const spawn = require('spawn-command');
const treeKill = require('tree-kill');

const StripQuotes = require('./command-parser/strip-quotes');
const ExpandNpmShortcut = require('./command-parser/expand-npm-shortcut');
const ExpandNpmWildcard = require('./command-parser/expand-npm-wildcard');

const CompletionListener = require('./completion-listener');

const getSpawnOpts = require('./get-spawn-opts');
const Command = require('./command');

const defaults = {
    spawn,
    kill: treeKill,
    raw: false,
    controllers: [],
    cwd: undefined,
    timings: false
};

module.exports = (commands, options) => {
    assert.ok(Array.isArray(commands), '[concurrently] commands should be an array');
    assert.notStrictEqual(commands.length, 0, '[concurrently] no commands provided');

    options = _.defaults(options, defaults);

    const commandParsers = [
        new StripQuotes(),
        new ExpandNpmShortcut(),
        new ExpandNpmWildcard()
    ];

    let lastColor = '';
    commands = _(commands)
        .map(mapToCommandInfo)
        .flatMap(command => parseCommand(command, commandParsers))
        .map((command, index) => {
            // Use documented behaviour of repeating last color when specifying more commands than colors
            lastColor = options.prefixColors && options.prefixColors[index] || lastColor;
            return new Command(
                Object.assign({
                    index,
                    spawnOpts: getSpawnOpts({
                        raw: options.raw,
                        env: command.env,
                        cwd: command.cwd || options.cwd,
                    }),
                    prefixColor: lastColor,
                    killProcess: options.kill,
                    spawn: options.spawn,
                    timings: options.timings,
                }, command)
            );
        })
        .value();

    const handleResult = options.controllers.reduce(
        ({ commands: prevCommands, onFinishCallbacks }, controller) => {
            const { commands, onFinish } = controller.handle(prevCommands);
            return {
                commands,
                onFinishCallbacks: _.concat(onFinishCallbacks, onFinish ? [onFinish] : [])
            };
        },
        { commands, onFinishCallbacks: [] }
    );
    commands = handleResult.commands;

    const commandsLeft = commands.slice();
    const maxProcesses = Math.max(1, Number(options.maxProcesses) || commandsLeft.length);
    for (let i = 0; i < maxProcesses; i++) {
        maybeRunMore(commandsLeft);
    }

    return new CompletionListener({
        successCondition: options.successCondition,
    })
        .listen(commands)
        .finally(() => {
            handleResult.onFinishCallbacks.forEach((onFinish) => onFinish());
        });
};

function mapToCommandInfo(command) {
    return Object.assign({
        command: command.command || command,
        name: command.name || '',
        env: command.env || {},
        cwd: command.cwd || '',

    }, command.prefixColor ? {
        prefixColor: command.prefixColor,
    } : {});
}

function parseCommand(command, parsers) {
    return parsers.reduce(
        (commands, parser) => _.flatMap(commands, command => parser.parse(command)),
        _.castArray(command)
    );
}

function maybeRunMore(commandsLeft) {
    const command = commandsLeft.shift();
    if (!command) {
        return;
    }

    command.start();
    command.close.subscribe(() => {
        maybeRunMore(commandsLeft);
    });
}
