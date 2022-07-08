# Concurrently

[![Build Status](https://github.com/open-cli-tools/concurrently/workflows/Tests/badge.svg)](https://github.com/open-cli-tools/concurrently/actions?workflow=Tests) 
[![Coverage Status](https://coveralls.io/repos/github/open-cli-tools/concurrently/badge.svg?branch=master)](https://coveralls.io/github/open-cli-tools/concurrently?branch=master)

[![NPM Badge](https://nodei.co/npm/concurrently.png?downloads=true)](https://www.npmjs.com/package/concurrently)

Run multiple commands concurrently.
Like `npm run watch-js & npm run watch-less` but better.

![](docs/demo.gif)

**Table of contents**
- [Concurrently](#concurrently)
  - [Why](#why)
  - [Install](#install)
  - [Usage](#usage)
  - [Programmatic Usage](#programmatic-usage)
    - [`concurrently(commands[, options])`](#concurrentlycommands-options)
  - [FAQ](#faq)

## Why

I like [task automation with npm](https://github.com/substack/blog/blob/master/npm_run.markdown)
but the usual way to run multiple commands concurrently is
`npm run watch-js & npm run watch-css`. That's fine but it's hard to keep
on track of different outputs. Also if one process fails, others still keep running
and you won't even notice the difference.

Another option would be to just run all commands in separate terminals. I got
tired of opening terminals and made **concurrently**.

**Features:**

* Cross platform (including Windows)
* Output is easy to follow with prefixes
* With `--kill-others` switch, all commands are killed if one dies
* Spawns commands with [spawn-command](https://github.com/mmalecki/spawn-command)

## Install

The tool is written in Node.js, but you can use it to run **any** commands.

```bash
npm install -g concurrently
```

or if you are using it from npm scripts:

```bash
npm install concurrently --save
```

## Usage

Remember to surround separate commands with quotes:
```bash
concurrently "command1 arg" "command2 arg"
```

Otherwise **concurrently** would try to run 4 separate commands:
`command1`, `arg`, `command2`, `arg`.

In package.json, escape quotes:

```bash
"start": "concurrently \"command1 arg\" \"command2 arg\""
```

NPM run commands can be shortened:

```bash
concurrently "npm:watch-js" "npm:watch-css" "npm:watch-node"

# Equivalent to:
concurrently -n watch-js,watch-css,watch-node "npm run watch-js" "npm run watch-css" "npm run watch-node"
```

NPM shortened commands also support wildcards. Given the following scripts in
package.json:

```javascript
{
    //...
    "scripts": {
        // ...
        "watch-js": "...",
        "watch-css": "...",
        "watch-node": "...",
        // ...
    },
    // ...
}
```

```bash
concurrently "npm:watch-*"

# Equivalent to:
concurrently -n js,css,node "npm run watch-js" "npm run watch-css" "npm run watch-node"

# Any name provided for the wildcard command will be used as a prefix to the wildcard
# part of the script name:
concurrently -n w: npm:watch-*

# Equivalent to:
concurrently -n w:js,w:css,w:node "npm run watch-js" "npm run watch-css" "npm run watch-node"
```

Good frontend one-liner example [here](https://github.com/kimmobrunfeldt/dont-copy-paste-this-frontend-template/blob/5cd2bde719654941bdfc0a42c6f1b8e69ae79980/package.json#L9).

Help:

```

concurrently [options] <command ...>

General
  -m, --max-processes   How many processes should run at once.
                        New processes only spawn after all restart tries of a
                        process.                                        [number]
  -n, --names           List of custom names to be used in prefix template.
                        Example names: "main,browser,server"            [string]
      --name-separator  The character to split <names> on. Example usage:
                        concurrently -n "styles|scripts|server" --name-separator
                        "|"                                       [default: ","]
  -r, --raw             Output only raw output of processes, disables
                        prettifying and concurrently coloring.         [boolean]
  -s, --success         Return exit code of zero or one based on the success or
                        failure of the "first" child to terminate, the "last
                        child", or succeed only if "all" child processes
                        succeed.
                              [choices: "first", "last", "all"] [default: "all"]
      --no-color        Disables colors from logging                   [boolean]
      --hide            Comma-separated list of processes to hide the output.
                        The processes can be identified by their name or index.
                                                          [string] [default: ""]

Prefix styling
  -p, --prefix            Prefix used in logging for each process.
                          Possible values: index, pid, time, command, name,
                          none, or a template. Example template: "{time}-{pid}"
                         [string] [default: index or name (when --names is set)]
  -c, --prefix-colors     Comma-separated list of chalk colors to use on
                          prefixes. If there are more commands than colors, the
                          last color will be repeated.
                          - Available modifiers: reset, bold, dim, italic,
                          underline, inverse, hidden, strikethrough
                          - Available colors: black, red, green, yellow, blue,
                          magenta, cyan, white, gray, or any hex values for
                          colors, eg #23de43
                          - Available background colors: bgBlack, bgRed,
                          bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan, bgWhite
                          See https://www.npmjs.com/package/chalk for more
                          information.            [string] [default: "reset"]
  -l, --prefix-length     Limit how many characters of the command is displayed
                          in prefix. The option can be used to shorten the
                          prefix when it is set to "command"
                                                          [number] [default: 10]
  -t, --timestamp-format  Specify the timestamp in moment/date-fns format.
                                   [string] [default: "yyyy-MM-dd HH:mm:ss.SSS"]

Input handling
  -i, --handle-input      Whether input should be forwarded to the child
                          processes. See examples for more information.[boolean]
  --default-input-target  Identifier for child process to which input on stdin
                          should be sent if not specified at start of input.
                          Can be either the index or the name of the process.
                                                                    [default: 0]

Killing other processes
  -k, --kill-others      kill other processes if one exits or dies     [boolean]
  --kill-others-on-fail  kill other processes if one exits with non zero status
                         code                                          [boolean]

Restarting
      --restart-tries  How many times a process that died should restart.
                       Negative numbers will make the process restart forever.
                                                           [number] [default: 0]
      --restart-after  Delay time to respawn the process, in milliseconds.
                                                           [number] [default: 0]

Options:
  -h, --help         Show help                                         [boolean]
  -v, -V, --version  Show version number                               [boolean]

Examples:

 - Output nothing more than stdout+stderr of child processes

     $ concurrently --raw "npm run watch-less" "npm run watch-js"

 - Normal output but without colors e.g. when logging to file

     $ concurrently --no-color "grunt watch" "http-server" > log

 - Custom prefix

     $ concurrently --prefix "{time}-{pid}" "npm run watch" "http-server"

 - Custom names and colored prefixes

     $ concurrently --names "HTTP,WATCH" -c "bgBlue.bold,bgMagenta.bold"
     "http-server" "npm run watch"

 - Configuring via environment variables with CONCURRENTLY_ prefix

     $ CONCURRENTLY_RAW=true CONCURRENTLY_KILL_OTHERS=true concurrently "echo hello" "echo world"

 - Send input to default

     $ concurrently --handle-input "nodemon" "npm run watch-js"
     rs  # Sends rs command to nodemon process

 - Send input to specific child identified by index

     $ concurrently --handle-input "npm run watch-js" nodemon
     1:rs

 - Send input to specific child identified by name

     $ concurrently --handle-input -n js,srv "npm run watch-js" nodemon
     srv:rs

 - Shortened NPM run commands

     $ concurrently npm:watch-node npm:watch-js npm:watch-css

 - Shortened NPM run command with wildcard (make sure to wrap it in quotes!)

     $ concurrently "npm:watch-*"

For more details, visit https://github.com/open-cli-tools/concurrently
```

## Programmatic Usage
concurrently can be used programmatically by using the API documented below:

### `concurrently(commands[, options])`

- `commands`: an array of either strings (containing the commands to run) or objects
  with the shape `{ command, name, prefixColor, env, cwd }`.

- `options` (optional): an object containing any of the below:
    - `cwd`: the working directory to be used by all commands. Can be overriden per command.
    Default: `process.cwd()`.
    - `defaultInputTarget`: the default input target when reading from `inputStream`.
    Default: `0`.
    - `handleInput`: when `true`, reads input from `process.stdin`.
    - `inputStream`: a [`Readable` stream](https://nodejs.org/dist/latest-v10.x/docs/api/stream.html#stream_readable_streams)
    to read the input from. Should only be used in the rare instance you would like to stream anything other than `process.stdin`. Overrides `handleInput`.
    - `pauseInputStreamOnFinish`: by default, pauses the input stream (`process.stdin` when `handleInput` is enabled, or `inputStream` if provided) when all of the processes have finished. If you need to read from the input stream after `concurrently` has finished, set this to `false`. ([#252](https://github.com/kimmobrunfeldt/concurrently/issues/252)).
    - `killOthers`: an array of exitting conditions that will cause a process to kill others.
    Can contain any of `success` or `failure`.
    - `maxProcesses`: how many processes should run at once.
    - `outputStream`: a [`Writable` stream](https://nodejs.org/dist/latest-v10.x/docs/api/stream.html#stream_writable_streams)
    to write logs to. Default: `process.stdout`.
    - `prefix`: the prefix type to use when logging processes output.
      Possible values: `index`, `pid`, `time`, `command`, `name`, `none`, or a template (eg `[{time} process: {pid}]`).
      Default: the name of the process, or its index if no name is set.
    - `prefixColors`: a list of colors as supported by [chalk](https://www.npmjs.com/package/chalk).
      If concurrently would run more commands than there are colors, the last color is repeated.
      Prefix colors specified per-command take precedence over this list.
    - `prefixLength`: how many characters to show when prefixing with `command`. Default: `10`
    - `raw`: whether raw mode should be used, meaning strictly process output will
    be logged, without any prefixes, colouring or extra stuff.
    - `successCondition`: the condition to consider the run was successful.
    If `first`, only the first process to exit will make up the success of the run; if `last`, the last process that exits will determine whether the run succeeds.
    Anything else means all processes should exit successfully.
    - `restartTries`: how many attempts to restart a process that dies will be made. Default: `0`.
    - `restartDelay`: how many milliseconds to wait between process restarts. Default: `0`.
    - `timestampFormat`: a [date-fns format](https://date-fns.org/v2.0.1/docs/format)
    to use when prefixing with `time`. Default: `yyyy-MM-dd HH:mm:ss.ZZZ`

> Returns: a `Promise` that resolves if the run was successful (according to `successCondition` option),
> or rejects, containing an array of objects with information for each command that has been run, in the order
> that the commands terminated. The objects have the shape `{ command, index, exitCode, killed }`, where `command` is the object
> passed in the `commands` array, `index` its index there and `killed` indicates if the process was killed as a result of
> `killOthers`. Default values (empty strings or objects) are returned for the fields that were not specified.

Example:

```js
const concurrently = require('concurrently');
concurrently([
    'npm:watch-*',
    { command: 'nodemon', name: 'server' },
    { command: 'deploy', name: 'deploy', env: { PUBLIC_KEY: '...' } },
    { command: 'watch', name: 'watch', cwd: path.resolve(__dirname, 'scripts/watchers')}
], {
    prefix: 'name',
    killOthers: ['failure', 'success'],
    restartTries: 3,
    cwd: path.resolve(__dirname, 'scripts'),
}).then(success, failure);
```

## FAQ

* Process exited with code *null*?

    From [Node child_process documentation](http://nodejs.org/api/child_process.html#child_process_event_exit), `exit` event:

    > This event is emitted after the child process ends. If the process
    > terminated normally, code is the final exit code of the process,
    > otherwise null. If the process terminated due to receipt of a signal,
    > signal is the string name of the signal, otherwise null.


    So *null* means the process didn't terminate normally. This will make **concurrent**
    to return non-zero exit code too.

* Does this work with the npm-replacements [yarn](https://github.com/yarnpkg/yarn) or [pnpm](https://pnpm.js.org/)?

    Yes! In all examples above, you may replace "`npm`" with "`yarn`" or "`pnpm`".
