import type { Server } from 'node:http';
import type { LoggingRepository } from 'src/repositories/logging.repository.js';

// Codes a client can cause by disappearing mid-request. They are expected on the
// public internet (mobile clients switching networks, apps being suspended,
// proxies timing out) and are not a server fault, so they are logged at debug
// level.
const BENIGN_CONNECTION_CODES = new Set([
  'ECONNRESET',
  'ECONNABORTED',
  'EPIPE',
  'ERR_STREAM_PREMATURE_CLOSE',
  'ETIMEDOUT',
]);

/**
 * Node emits `error` on the socket of every connection when a client goes away
 * in an unexpected way. The event is emitted asynchronously and, if nothing
 * listens for it, Node treats it as an uncaught exception and takes the whole
 * process down — a single aborted upload was enough to stop Immich for every
 * user. Node's HTTP server only guards the socket while it owns it, so the
 * listener is attached here, per connection, for the lifetime of the socket.
 */
export function handleConnectionErrors(server: Server, logger: LoggingRepository) {
  server.on('connection', (socket) => {
    socket.on('error', (error: Error & { code?: string }) => {
      if (error.code && BENIGN_CONNECTION_CODES.has(error.code)) {
        logger.debug(`Client connection error: ${error.code}`);
        return;
      }

      logger.error(`Client connection error: ${error.message}`);
    });
  });
}
