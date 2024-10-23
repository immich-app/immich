const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

const options = new cast.framework.CastReceiverOptions();
options.disableIdleTimeout = true;

context.start(options);
