import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { SignJWT } from 'jose';
import { randomBytes } from 'node:crypto';
import { Server as SocketIO } from 'socket.io';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { ConfigRepository } from 'src/repositories/config.repository';
import { AppRestartEvent } from 'src/repositories/event.repository';

export async function sendOneShotAppRestart(state: AppRestartEvent): Promise<void> {
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
