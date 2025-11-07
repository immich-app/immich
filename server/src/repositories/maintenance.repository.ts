import { Injectable } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server as SocketIO } from 'socket.io';
import { ExitCode } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { AppRestartEvent } from 'src/repositories/event.repository';

@Injectable()
export class MaintenanceRepository {
  private closeFn?: () => Promise<void>;

  constructor(private configRepository: ConfigRepository) {}

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

  sendOneShotAppRestart(state: AppRestartEvent): void {
    const server = new SocketIO();
    const pubClient = new Redis(this.configRepository.getEnv().redis);
    const subClient = pubClient.duplicate();
    server.adapter(createAdapter(pubClient, subClient));

    /**
     * Keep trying until we manage to stop Immich
     *
     * Sometimes there appear to be communication
     * issues between to the other servers.
     *
     * This issue only occurs with this method.
     */
    function tryTerminate(cb: () => void) {
      server.serverSideEmit('AppRestart', state, (arg0: null | any, responses: any[]) => {
        if (arg0 === null && responses.length === 0) {
          console.info(
            "\nIt doesn't appear that Immich stopped, trying again in a moment.\nIf Immich is already not running, you can ignore this error.",
          );

          setTimeout(() => tryTerminate(cb), 1e3);
        } else {
          cb();
        }
      });
    }

    // => corresponds to notification.service.ts#onAppRestart
    server.emit('AppRestartV1', state, () => {
      tryTerminate(() => {
        pubClient.disconnect();
        subClient.disconnect();
      });
    });
  }
}
