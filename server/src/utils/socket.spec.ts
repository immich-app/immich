import { EventEmitter } from 'node:events';
import type { Server } from 'node:http';
import type { LoggingRepository } from 'src/repositories/logging.repository.js';
import { handleConnectionErrors } from 'src/utils/socket.js';

const asServer = (emitter: EventEmitter) => emitter as unknown as Server;

const asLogger = () =>
  ({ debug: vi.fn(), error: vi.fn() }) as unknown as LoggingRepository & {
    debug: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

describe('handleConnectionErrors', () => {
  it('should keep a benign connection error from becoming an unhandled error event', () => {
    const server = asServer(new EventEmitter());
    const socket = new EventEmitter();
    const logger = asLogger();

    handleConnectionErrors(server, logger);
    server.emit('connection', socket);

    // without the listener this emit throws, which is how a client reset used to
    // take the whole server down
    expect(() =>
      socket.emit('error', Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })),
    ).not.toThrow();
    expect(logger.debug).toHaveBeenCalledWith('Client connection error: ECONNRESET');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should report unexpected connection errors', () => {
    const server = asServer(new EventEmitter());
    const socket = new EventEmitter();
    const logger = asLogger();

    handleConnectionErrors(server, logger);
    server.emit('connection', socket);
    socket.emit('error', new Error('boom'));

    expect(logger.error).toHaveBeenCalledWith('Client connection error: boom');
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it('should handle every connection', () => {
    const server = asServer(new EventEmitter());
    const logger = asLogger();

    handleConnectionErrors(server, logger);
    for (let index = 0; index < 3; index++) {
      const socket = new EventEmitter();
      server.emit('connection', socket);
      socket.emit('error', Object.assign(new Error('write EPIPE'), { code: 'EPIPE' }));
    }

    expect(logger.debug).toHaveBeenCalledTimes(3);
  });
});
