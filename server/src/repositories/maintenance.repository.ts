import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PostgresError } from 'postgres';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { SystemMetadataKey } from 'src/enum';
import { EventRepository } from 'src/repositories/event.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { MaintenanceModeState } from 'src/types';

import * as jwt from 'jsonwebtoken';

export async function isMaintenanceMode(systemMetadataRepository: SystemMetadataRepository): Promise<boolean> {
  try {
    const value = await systemMetadataRepository.get(SystemMetadataKey.MaintenanceMode);
    return value?.isMaintenanceMode || false;
  } catch (error) {
    // Table doesn't exist (migrations haven't run yet)
    if (error instanceof PostgresError && error.code === '42P01') {
      return false;
    }

    throw error;
  }
}

@Injectable()
export class MaintenanceRepository {
  constructor(
    private eventRepository: EventRepository,
    private systemMetadataRepository: SystemMetadataRepository,
  ) {}

  isMaintenanceMode(): Promise<boolean> {
    return isMaintenanceMode(this.systemMetadataRepository);
  }

  async setMaintenanceMode(state: MaintenanceModeState) {
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    await this.eventRepository.emit('AppRestart', state);
  }

  async enterMaintenanceMode(): Promise<{ token: string }> {
    const token = randomBytes(64).toString('hex');
    const state: MaintenanceModeState = { isMaintenanceMode: true, token };

    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    await this.eventRepository.emit('AppRestart', state);

    return { token };
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
