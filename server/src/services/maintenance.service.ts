import { BadRequestException, Injectable } from '@nestjs/common';
import { SignJWT } from 'jose';
import { randomBytes } from 'node:crypto';
import { OnEvent } from 'src/decorators';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { MaintenanceModeState } from 'src/types';
import { getExternalDomain } from 'src/utils/misc';

/**
 * This service is available outside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class MaintenanceService extends BaseService {
  getMaintenanceMode(): Promise<MaintenanceModeState> {
    return this.systemMetadataRepository
      .get(SystemMetadataKey.MaintenanceMode)
      .then((state) => state ?? { isMaintenanceMode: false });
  }

  login(): MaintenanceAuthDto {
    throw new BadRequestException('Not in maintenance mode');
  }

  async startMaintenance(): Promise<{ secret: string }> {
    const { isMaintenanceMode } = await this.getMaintenanceMode();
    if (isMaintenanceMode) {
      throw new BadRequestException('Already in maintenance mode');
    }

    const secret = MaintenanceService.generateSecret();
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, { isMaintenanceMode: true, secret });
    await this.eventRepository.emit('AppRestart', { isMaintenanceMode: true });

    return { secret };
  }

  endMaintenance(): void {
    throw new BadRequestException('Not in maintenance mode');
  }

  @OnEvent({ name: 'AppRestart', server: true })
  onRestart(): void {
    this.maintenanceRepository.exitApp();
  }

  async createLoginUrl(auth: MaintenanceAuthDto, secret?: string): Promise<string> {
    const { server } = await this.getConfig({ withCache: true });
    const baseUrl = getExternalDomain(server);

    secret ??= await this.getMaintenanceMode().then((state) => {
      if (!state.isMaintenanceMode) {
        throw new Error('Not in maintenance mode');
      }

      return state.secret;
    });

    return await MaintenanceService.createLoginUrl(baseUrl, auth, secret!);
  }

  createJwt(secret: string, data: MaintenanceAuthDto): Promise<string> {
    return MaintenanceService.createJwt(secret, data);
  }

  static async createLoginUrl(baseUrl: string, auth: MaintenanceAuthDto, secret: string): Promise<string> {
    return `${baseUrl}/maintenance?token=${await MaintenanceService.createJwt(secret!, auth)}`;
  }

  static async createJwt(secret: string, data: MaintenanceAuthDto): Promise<string> {
    const alg = 'HS256';

    return await new SignJWT({ ...data })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('4h')
      .sign(new TextEncoder().encode(secret));
  }

  static generateSecret(): string {
    return randomBytes(64).toString('hex');
  }
}
