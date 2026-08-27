import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { Server, ServerOptions } from 'socket.io';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';

// The adapter's subscriber connection only ever receives, so it is idle by
// design. ioredis reconnects and re-subscribes when it observes the socket
// close, but a connection severed without a FIN or RST reaching us never
// produces that event: the client stays `ready` with no subscription behind it,
// and the worker silently stops receiving every server event until it restarts.
// A periodic PING turns that into an observable failure. `commandTimeout` alone
// would not help, because it rejects the command without closing the socket, and
// neither would `socketTimeout`, whose timer is armed when a command is written
// while an idle subscriber writes nothing.
//
// The thresholds are deliberately slack. A silently severed socket stays severed,
// so detecting it a few minutes later costs nothing, while reconnecting a healthy
// subscriber drops whatever is published during the reconnect. Redis has to be
// unresponsive for three consecutive minutes before this acts, which a fork stall
// or a slow script will not reach.
const HEARTBEAT_INTERVAL_MS = 60_000;
const HEARTBEAT_FAILURES_BEFORE_RECONNECT = 3;

// Structural, so a test can supply a stub and a real ioredis client still fits.
type HeartbeatClient = {
  status: string;
  ping: () => Promise<unknown>;
  disconnect: (reconnect?: boolean) => void;
};

type Heartbeat = { stop: () => void };

export const monitorRedisSubscriber = (
  client: HeartbeatClient,
  logger: Pick<LoggingRepository, 'warn'>,
  {
    intervalMs = HEARTBEAT_INTERVAL_MS,
    failuresBeforeReconnect = HEARTBEAT_FAILURES_BEFORE_RECONNECT,
  }: { intervalMs?: number; failuresBeforeReconnect?: number } = {},
): Heartbeat => {
  let failures = 0;
  let waiting = false;
  let stopped = false;

  const onFailure = (reason: string) => {
    failures++;
    logger.warn(`Redis subscriber heartbeat failed (${failures}/${failuresBeforeReconnect}): ${reason}`);
    if (failures < failuresBeforeReconnect) {
      return;
    }

    failures = 0;
    // The reconnect replaces the connection, so stop waiting on a ping sent over
    // the old one.
    waiting = false;
    logger.warn('Reconnecting the Redis subscriber to restore its subscriptions');
    // `true` keeps the retry strategy in play, so ioredis reconnects and
    // restores the channels (`autoResubscribe`, on by default).
    client.disconnect(true);
  };

  const beat = () => {
    if (stopped || client.status !== 'ready') {
      return;
    }

    // One ping at a time. An unanswered ping is the signal we are looking for,
    // and sending more would only pile up commands for ioredis to resend on the
    // next reconnect.
    if (waiting) {
      onFailure('the previous ping went unanswered');
      return;
    }

    waiting = true;
    client
      .ping()
      .then(() => {
        waiting = false;
        failures = 0;
      })
      .catch((error: Error | any) => {
        waiting = false;
        if (!stopped) {
          onFailure(error?.message || error);
        }
      });
  };

  const timer = setInterval(beat, intervalMs);
  timer.unref();

  return {
    stop: () => {
      stopped = true;
      clearInterval(timer);
    },
  };
};

export class WebSocketAdapter extends IoAdapter {
  private heartbeats = new Map<Server, Heartbeat>();
  private logger?: Promise<LoggingRepository>;

  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const { redis } = this.app.get(ConfigRepository).getEnv();
    const server = super.createIOServer(port, options);
    const pubClient = new Redis(redis);
    const subClient = pubClient.duplicate();
    server.adapter(createAdapter(pubClient, subClient));
    this.heartbeats.set(server, monitorRedisSubscriber(subClient, this.getLogger()));
    return server;
  }

  async close(server: Server) {
    this.heartbeats.get(server)?.stop();
    this.heartbeats.delete(server);
    await super.close(server);
  }

  // LoggingRepository is transient, so it cannot be fetched synchronously here.
  private getLogger(): Pick<LoggingRepository, 'warn'> {
    return {
      warn: (message: string) => {
        this.logger ??= this.app.resolve(LoggingRepository).then((logger) => {
          logger.setContext(WebSocketAdapter.name);
          return logger;
        });
        this.logger.then((logger) => logger.warn(message)).catch(() => console.warn(message));
      },
    };
  }
}
