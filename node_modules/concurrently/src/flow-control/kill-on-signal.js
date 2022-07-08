const { map } = require('rxjs/operators');

const BaseHandler = require('./base-handler');

module.exports = class KillOnSignal extends BaseHandler {
    constructor({ process }) {
        super();

        this.process = process;
    }

    handle(commands) {
        let caughtSignal;
        ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
            this.process.on(signal, () => {
                caughtSignal = signal;
                commands.forEach(command => command.kill(signal));
            });
        });

        return {
            commands: commands.map(command => {
                const closeStream = command.close.pipe(map(exitInfo => {
                    const exitCode = caughtSignal === 'SIGINT' ? 0 : exitInfo.exitCode;
                    return Object.assign({}, exitInfo, { exitCode });
                }));
                return new Proxy(command, {
                    get(target, prop) {
                        return prop === 'close' ? closeStream : target[prop];
                    }
                });
            })
        };
    }
};
