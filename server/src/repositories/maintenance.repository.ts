import { Injectable } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { SignJWT } from 'jose';
import { randomBytes } from 'node:crypto';
import { Server as SocketIO } from 'socket.io';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { ExitCode, SystemMetadataKey } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { AppRestartEvent, EventRepository } from 'src/repositories/event.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { MaintenanceModeState } from 'src/types';

@Injectable()
export class MaintenanceRepository {
  private closeFn?: () => Promise<void>;

  constructor(
    private configRepository: ConfigRepository,
    private eventRepository: EventRepository,
    private systemMetadataRepository: SystemMetadataRepository,
  ) {}

  getMaintenanceMode(): Promise<MaintenanceModeState<Uint8Array>> {
    return this.systemMetadataRepository
      .get(SystemMetadataKey.MaintenanceMode)
      .then((state) =>
        state?.isMaintenanceMode
          ? { isMaintenanceMode: true, secret: new TextEncoder().encode(state.secret) }
          : { isMaintenanceMode: false as const },
      );
  }

  async setMaintenanceMode(state: MaintenanceModeState<string>) {
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    await this.eventRepository.emit('AppRestart', state);
  }

  sendOneShotAppRestart(state: AppRestartEvent) {
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

  async enterMaintenanceMode(): Promise<{ secret: Uint8Array }> {
    const secret = randomBytes(64).toString('hex');
    const state: MaintenanceModeState<string> = { isMaintenanceMode: true, secret };

    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    await this.eventRepository.emit('AppRestart', state);

    return { secret: new TextEncoder().encode(secret) };
  }

  exitApp() {
    /* eslint-disable unicorn/no-process-exit */
    void this.closeFn?.().then(() => process.exit(ExitCode.AppRestart));

    // in exceptional circumstance, the application may hang
    setTimeout(() => process.exit(ExitCode.AppRestart), 5000);
    /* eslint-enable unicorn/no-process-exit */
  }

  async createLoginUrl(baseUrl: string, auth: MaintenanceAuthDto, secret?: Uint8Array) {
    secret ??= await this.getMaintenanceMode().then((state) => {
      if (!state.isMaintenanceMode) {
        throw new Error('Not in maintenance mode.');
      }

      return state.secret;
    });

    return await MaintenanceRepository.createLoginUrl(baseUrl, auth, secret!);
  }

  static async createLoginUrl(baseUrl: string, auth: MaintenanceAuthDto, secret: Uint8Array) {
    return `${baseUrl}/maintenance?token=${encodeURIComponent(await MaintenanceRepository.createJwt(secret!, auth))}`;
  }

  static async createJwt(secret: Uint8Array, data: MaintenanceAuthDto) {
    const alg = 'HS256';

    return await new SignJWT({ ...data })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('4h')
      .sign(secret);
  }

  setCloseFn(fn: () => Promise<void>) {
    this.closeFn = fn;
  }
}
