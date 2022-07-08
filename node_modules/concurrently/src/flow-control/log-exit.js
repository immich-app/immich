const BaseHandler = require('./base-handler');

module.exports = class LogExit extends BaseHandler {
    handle(commands) {
        commands.forEach(command => command.close.subscribe(({ exitCode }) => {
            this.logger.logCommandEvent(`${command.command} exited with code ${exitCode}`, command);
        }));

        return { commands };
    }
};
