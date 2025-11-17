import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { SignJWT } from 'jose';
import { randomBytes } from 'node:crypto';
import { Server as SocketIO } from 'socket.io';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { ConfigRepository } from 'src/repositories/config.repository';
import { AppRestartEvent } from 'src/repositories/event.repository';

export function sendOneShotAppRestart(state: AppRestartEvent): void {
  const server = new SocketIO();
  const { redis } = new ConfigRepository().getEnv();
  const pubClient = new Redis(redis);
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
  async function tryTerminate() {
    while (true) {
      try {
        const responses = await server.serverSideEmitWithAck('AppRestart', state);
        if (responses.length > 0) {
          return;
        }
      } catch (error) {
        console.error(error);
        console.error('Encountered an error while telling Immich to stop.');
      }

      console.info(
        "\nIt doesn't appear that Immich stopped, trying again in a moment.\nIf Immich is already not running, you can ignore this error.",
      );

      await new Promise((r) => setTimeout(r, 1e3));
    }
  }

  // => corresponds to notification.service.ts#onAppRestart
  server.emit('AppRestartV1', state, () => {
    void tryTerminate().finally(() => {
      pubClient.disconnect();
      subClient.disconnect();
    });
  });
}

export async function createMaintenanceLoginUrl(
  baseUrl: string,
  auth: MaintenanceAuthDto,
  secret: string,
): Promise<string> {
  return `${baseUrl}/maintenance?token=${await signMaintenanceJwt(secret, auth)}`;
}

export async function signMaintenanceJwt(secret: string, data: MaintenanceAuthDto): Promise<string> {
  const alg = 'HS256';

  return await new SignJWT({ ...data })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('4h')
    .sign(new TextEncoder().encode(secret));
}

export function generateMaintenanceSecret(): string {
  return randomBytes(64).toString('hex');
}
