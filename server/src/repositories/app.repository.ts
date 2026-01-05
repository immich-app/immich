import { Injectable } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server as SocketIO } from 'socket.io';
import { ExitCode } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { AppRestartEvent } from 'src/repositories/event.repository';

@Injectable()
export class AppRepository {
  private closeFn?: () => Promise<void>;

  exitApp() {
    /* eslint-disable unicorn/no-process-exit */
    void this.closeFn?.().finally(() => process.exit(ExitCode.AppRestart));

    // in exceptional circumstance, the application may hang
    setTimeout(() => process.exit(ExitCode.AppRestart), 2000);
    /* eslint-enable unicorn/no-process-exit */
  }

  setCloseFn(fn: () => Promise<void>) {
    this.closeFn = fn;
  }

  async sendOneShotAppRestart(state: AppRestartEvent): Promise<void> {
    const server = new SocketIO();
    const { redis } = new ConfigRepository().getEnv();
    const pubClient = new Redis({ ...redis, lazyConnect: true });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    server.adapter(createAdapter(pubClient, subClient));

    // => corresponds to notification.service.ts#onAppRestart
    server.emit('AppRestartV1', state, async () => {
      const responses = await server.serverSideEmitWithAck('AppRestart', state);
      if (responses.some((response) => response !== 'ok')) {
        throw new Error("One or more node(s) returned a non-'ok' response to our restart request!");
      }

      pubClient.disconnect();
      subClient.disconnect();
    });
  }
}
