import { Injectable } from '@nestjs/common';
import { basename } from 'node:path';
import { Readable } from 'node:stream';
import { OnEvent } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  MaintenanceAuthDto,
  MaintenanceGetIntegrityReportDto,
  MaintenanceIntegrityReportResponseDto,
  MaintenanceIntegrityReportSummaryResponseDto,
} from 'src/dtos/maintenance.dto';
import { AssetStatus, CacheControl, IntegrityReportType, SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { MaintenanceModeState } from 'src/types';
import { ImmichFileResponse } from 'src/utils/file';
import { createMaintenanceLoginUrl, generateMaintenanceSecret, signMaintenanceJwt } from 'src/utils/maintenance';
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

  async startMaintenance(username: string): Promise<{ jwt: string }> {
    const secret = generateMaintenanceSecret();
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, { isMaintenanceMode: true, secret });
    await this.eventRepository.emit('AppRestart', { isMaintenanceMode: true });

    return {
      jwt: await signMaintenanceJwt(secret, {
        username,
      }),
    };
  }

  @OnEvent({ name: 'AppRestart', server: true })
  onRestart(): void {
    this.appRepository.exitApp();
  }

  async createLoginUrl(auth: MaintenanceAuthDto, secret?: string): Promise<string> {
    const { server } = await this.getConfig({ withCache: true });
    const baseUrl = getExternalDomain(server);

    if (!secret) {
      const state = await this.getMaintenanceMode();
      if (!state.isMaintenanceMode) {
        throw new Error('Not in maintenance mode');
      }

      secret = state.secret;
    }

    return await createMaintenanceLoginUrl(baseUrl, auth, secret);
  }

  getIntegrityReportSummary(): Promise<MaintenanceIntegrityReportSummaryResponseDto> {
    return this.integrityRepository.getIntegrityReportSummary();
  }

  async getIntegrityReport(dto: MaintenanceGetIntegrityReportDto): Promise<MaintenanceIntegrityReportResponseDto> {
    return {
      items: await this.integrityRepository.getIntegrityReports(dto.type),
    };
  }

  getIntegrityReportCsv(type: IntegrityReportType): Readable {
    return this.integrityRepository.streamIntegrityReportsCSV(type);
  }

  async getIntegrityReportFile(id: string): Promise<ImmichFileResponse> {
    const { path } = await this.integrityRepository.getById(id);

    return new ImmichFileResponse({
      path,
      fileName: basename(path),
      contentType: 'application/octet-stream',
      cacheControl: CacheControl.PrivateWithoutCache,
    });
  }

  async deleteIntegrityReport(auth: AuthDto, id: string): Promise<void> {
    const { path, assetId, fileAssetId } = await this.integrityRepository.getById(id);

    if (assetId) {
      await this.assetRepository.updateAll([assetId], {
        deletedAt: new Date(),
        status: AssetStatus.Trashed,
      });

      await this.eventRepository.emit('AssetTrashAll', {
        assetIds: [assetId],
        userId: auth.user.id,
      });

      await this.integrityRepository.deleteById(id);
    } else if (fileAssetId) {
      await this.assetRepository.deleteFiles([{ id: fileAssetId }]);
    } else {
      await this.storageRepository.unlink(path);
      await this.integrityRepository.deleteById(id);
    }
  }
}
