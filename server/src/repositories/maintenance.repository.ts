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
    void this.closeFn?.().then(() => process.exit(ExitCode.AppRestart));

    // in exceptional circumstance, the application may hang
    setTimeout(() => process.exit(ExitCode.AppRestart), 5000);
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

    // => corresponds to notification.service.ts#onAppRestart
    server.emit('AppRestartV1', state, () => {
      server.serverSideEmit('AppRestart', state, () => {
        pubClient.disconnect();
        subClient.disconnect();
      });
    });
  }
}
