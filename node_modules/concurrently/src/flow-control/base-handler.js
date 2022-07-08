module.exports = class BaseHandler {
    constructor(options = {}) {
        const { logger } = options;

        this.logger = logger;
    }

    handle(commands) {
        return {
            commands,
            // an optional callback to call when all commands have finished
            // (either successful or not)
            onFinish: null,
        };
    }
};
