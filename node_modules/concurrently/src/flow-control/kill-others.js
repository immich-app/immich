const _ = require('lodash');
const { filter, map } = require('rxjs/operators');

const BaseHandler = require('./base-handler');

module.exports = class KillOthers extends BaseHandler {
    constructor({ logger, conditions }) {
        super({ logger });

        this.conditions = _.castArray(conditions);
    }

    handle(commands) {
        const conditions = this.conditions.filter(condition => (
            condition === 'failure' ||
            condition === 'success'
        ));

        if (!conditions.length) {
            return { commands };
        }

        const closeStates = commands.map(command => command.close.pipe(
            map(({ exitCode }) => exitCode === 0 ? 'success' : 'failure'),
            filter(state => conditions.includes(state))
        ));

        closeStates.forEach(closeState => closeState.subscribe(() => {
            const killableCommands = commands.filter(command => command.killable);
            if (killableCommands.length) {
                this.logger.logGlobalEvent('Sending SIGTERM to other processes..');
                killableCommands.forEach(command => command.kill());
            }
        }));

        return { commands };
    }
};
