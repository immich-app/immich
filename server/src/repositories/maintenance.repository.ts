import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { SystemMetadataKey } from 'src/enum';
import { EventRepository } from 'src/repositories/event.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { MaintenanceModeState } from 'src/types';

import * as jwt from 'jsonwebtoken';

@Injectable()
export class MaintenanceRepository {
  constructor(
    private eventRepository: EventRepository,
    private systemMetadataRepository: SystemMetadataRepository,
  ) {}

  getMaintenanceMode(): Promise<MaintenanceModeState> {
    return this.systemMetadataRepository
      .get(SystemMetadataKey.MaintenanceMode)
      .then((state) => state ?? { isMaintenanceMode: false });
  }

  async setMaintenanceMode(state: MaintenanceModeState) {
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    await this.eventRepository.emit('AppRestart', state);
  }

  async enterMaintenanceMode(): Promise<{ secret: string }> {
    const secret = randomBytes(64).toString('hex');
    const state: MaintenanceModeState = { isMaintenanceMode: true, secret };

    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    await this.eventRepository.emit('AppRestart', state);

    return { secret: secret };
  }

  async createLoginUrl(baseUrl: string, auth: MaintenanceAuthDto, secret?: string) {
    secret ??= await this.getMaintenanceMode().then((state) => {
      if (!state.isMaintenanceMode) {
        throw new Error('Not in maintenance mode.');
      }

      return state.secret;
    });

    return MaintenanceRepository.createLoginUrl(baseUrl, auth, secret!);
  }

  static createLoginUrl(baseUrl: string, auth: MaintenanceAuthDto, secret: string) {
    return `${baseUrl}/maintenance?token=${encodeURIComponent(MaintenanceRepository.createJwt(secret!, auth))}`;
  }

  static createJwt(secret: string, data: MaintenanceAuthDto) {
    return jwt.sign(
      {
        data,
      },
      secret,
      {
        expiresIn: '4h',
      },
    );
  }
}
