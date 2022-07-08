const BaseHandler = require('./base-handler');

module.exports = class LogOutput extends BaseHandler {
    handle(commands) {
        commands.forEach(command => {
            command.stdout.subscribe(text => this.logger.logCommandText(text.toString(), command));
            command.stderr.subscribe(text => this.logger.logCommandText(text.toString(), command));
        });

        return { commands };
    }
};
