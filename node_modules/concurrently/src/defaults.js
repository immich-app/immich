/**
 * This file is meant to be a shared place for default configs.
 * It's read by the flow controllers, the executable, etc.
 *
 * Refer to tests for the meaning of the different possible values.
 */
module.exports = {
    defaultInputTarget: 0,
    // Whether process.stdin should be forwarded to child processes
    handleInput: false,
    // How many processes to run at once
    maxProcesses: 0,
    // Indices and names of commands whose output to be not logged
    hide: '',
    nameSeparator: ',',
    // Which prefix style to use when logging processes output.
    prefix: '',
    // Refer to https://www.npmjs.com/package/chalk
    prefixColors: 'reset',
    // How many bytes we'll show on the command prefix
    prefixLength: 10,
    raw: false,
    // Number of attempts of restarting a process, if it exits with non-0 code
    restartTries: 0,
    // How many milliseconds concurrently should wait before restarting a process.
    restartDelay: 0,
    // Condition of success for concurrently itself.
    success: 'all',
    // Refer to https://date-fns.org/v2.0.1/docs/format
    timestampFormat: 'yyyy-MM-dd HH:mm:ss.SSS',
    // Current working dir passed as option to spawn command. Default: process.cwd()
    cwd: undefined,
    // Whether to show timing information for processes in console output
    timings: false,
};
