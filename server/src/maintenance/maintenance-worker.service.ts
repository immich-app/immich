import { Injectable, UnauthorizedException } from '@nestjs/common';
import { parse } from 'cookie';
import { NextFunction, Request, Response } from 'express';
import { jwtVerify } from 'jose';
import { readFileSync } from 'node:fs';
import { IncomingHttpHeaders } from 'node:http';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { ServerConfigDto } from 'src/dtos/server.dto';
import { ImmichCookie, SystemMetadataKey } from 'src/enum';
import { MaintenanceEphemeralStateRepository } from 'src/maintenance/maintenance-ephemeral-state.repository';
import { MaintenanceWebsocketRepository } from 'src/maintenance/maintenance-websocket.repository';
import { AppRepository } from 'src/repositories/app.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ProcessRepository } from 'src/repositories/process.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { type ApiService as _ApiService } from 'src/services/api.service';
import { type BaseService as _BaseService } from 'src/services/base.service';
import { type ServerService as _ServerService } from 'src/services/server.service';
import { MaintenanceModeState } from 'src/types';
import { deleteBackup, listBackups } from 'src/utils/backups';
import { getConfig } from 'src/utils/config';
import { createMaintenanceLoginUrl } from 'src/utils/maintenance';
import { getExternalDomain } from 'src/utils/misc';

/**
 * This service is available inside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class MaintenanceWorkerService {
  constructor(
    protected logger: LoggingRepository,
    private appRepository: AppRepository,
    private configRepository: ConfigRepository,
    private systemMetadataRepository: SystemMetadataRepository,
    private maintenanceWorkerRepository: MaintenanceWebsocketRepository,
    private maintenanceEphemeralStateRepository: MaintenanceEphemeralStateRepository,
    private storageRepository: StorageRepository,
    private processRepository: ProcessRepository,
    private databaseRepository: DatabaseRepository,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /**
   * {@link _BaseService.configRepos}
   */
  private get configRepos() {
    return {
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    };
  }

  /**
   * {@link _BaseService.prototype.getConfig}
   */
  private getConfig(options: { withCache: boolean }) {
    return getConfig(this.configRepos, options);
  }

  /**
   * {@link _ServerService.getSystemConfig}
   */
  async getSystemConfig() {
    return {
      maintenanceMode: true,
    } as ServerConfigDto;
  }

  /**
   * {@link _ApiService.ssr}
   */
  ssr(excludePaths: string[]) {
    const { resourcePaths } = this.configRepository.getEnv();

    let index = '';
    try {
      index = readFileSync(resourcePaths.web.indexHtml).toString();
    } catch {
      this.logger.warn(`Unable to open ${resourcePaths.web.indexHtml}, skipping SSR.`);
    }

    return (request: Request, res: Response, next: NextFunction) => {
      if (
        request.url.startsWith('/api') ||
        request.method.toLowerCase() !== 'get' ||
        excludePaths.some((item) => request.url.startsWith(item))
      ) {
        return next();
      }

      const maintenancePath = '/maintenance';
      if (!request.url.startsWith(maintenancePath)) {
        const params = new URLSearchParams();
        params.set('continue', request.path);
        return res.redirect(`${maintenancePath}?${params}`);
      }

      res.status(200).type('text/html').header('Cache-Control', 'no-store').send(index);
    };
  }

  /**
   * {@link _StorageService.detectMediaLocation}
   */
  detectMediaLocation(): string {
    const envData = this.configRepository.getEnv();
    if (envData.storage.mediaLocation) {
      return envData.storage.mediaLocation;
    }

    const targets: string[] = [];
    const candidates = ['/data', '/usr/src/app/upload'];

    for (const candidate of candidates) {
      const exists = this.storageRepository.existsSync(candidate);
      if (exists) {
        targets.push(candidate);
      }
    }

    if (targets.length === 1) {
      return targets[0];
    }

    return '/usr/src/app/upload';
  }

  async logSecret(): Promise<void> {
    const { server } = await this.getConfig({ withCache: true });

    const baseUrl = getExternalDomain(server);
    const url = await createMaintenanceLoginUrl(
      baseUrl,
      {
        username: 'immich-admin',
      },
      this.maintenanceEphemeralStateRepository.getSecret(),
    );

    this.logger.log(`\n\n🚧 Immich is in maintenance mode, you can log in using the following URL:\n${url}\n`);
  }

  async authenticate(headers: IncomingHttpHeaders): Promise<MaintenanceAuthDto> {
    const jwtToken = parse(headers.cookie || '')[ImmichCookie.MaintenanceToken];
    return this.login(jwtToken);
  }

  async login(jwt?: string): Promise<MaintenanceAuthDto> {
    if (!jwt) {
      throw new UnauthorizedException('Missing JWT Token');
    }

    const secret = this.maintenanceEphemeralStateRepository.getSecret();

    try {
      const result = await jwtVerify<MaintenanceAuthDto>(jwt, new TextEncoder().encode(secret));
      return result.payload;
    } catch {
      throw new UnauthorizedException('Invalid JWT Token');
    }
  }

  async endMaintenance(): Promise<void> {
    const state: MaintenanceModeState = { isMaintenanceMode: false as const };
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);

    // => corresponds to notification.service.ts#onAppRestart
    this.maintenanceWorkerRepository.clientBroadcast('AppRestartV1', state);
    this.maintenanceWorkerRepository.serverSend('AppRestart', state);
    this.appRepository.exitApp();
  }

  /**
   * Backups
   */

  async listBackups(): Promise<Record<'backups' | 'failedBackups', string[]>> {
    return listBackups(this.backupRepos);
  }

  async deleteBackup(filename: string): Promise<void> {
    return deleteBackup(this.backupRepos, filename);
  }

  private get backupRepos() {
    return {
      logger: this.logger,
      storage: this.storageRepository,
      config: this.configRepository,
      process: this.processRepository,
      database: this.databaseRepository,
    };
  }
}
