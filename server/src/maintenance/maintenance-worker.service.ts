import { Injectable, UnauthorizedException } from '@nestjs/common';
import { parse } from 'cookie';
import { NextFunction, Request, Response } from 'express';
import { jwtVerify } from 'jose';
import { readFileSync } from 'node:fs';
import { IncomingHttpHeaders } from 'node:http';
import { serverVersion } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import {
  MaintenanceAuthDto,
  MaintenanceDetectInstallResponseDto,
  MaintenanceStatusResponseDto,
  SetMaintenanceModeDto,
} from 'src/dtos/maintenance.dto';
import { ServerConfigDto, ServerVersionResponseDto } from 'src/dtos/server.dto';
import { DatabaseLock, ImmichCookie, MaintenanceAction, SystemMetadataKey } from 'src/enum';
import { MaintenanceHealthRepository } from 'src/maintenance/maintenance-health.repository';
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
import { DatabaseBackupService } from 'src/services/database-backup.service';
import { type ServerService as _ServerService } from 'src/services/server.service';
import { type VersionService as _VersionService } from 'src/services/version.service';
import { MaintenanceModeState } from 'src/types';
import { getConfig } from 'src/utils/config';
import { createMaintenanceLoginUrl, detectPriorInstall } from 'src/utils/maintenance';
import { getExternalDomain } from 'src/utils/misc';

/**
 * This service is available inside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class MaintenanceWorkerService {
  #secret: string | null = null;
  #status: MaintenanceStatusResponseDto = {
    active: true,
    action: MaintenanceAction.Start,
  };

  constructor(
    protected logger: LoggingRepository,
    private appRepository: AppRepository,
    private configRepository: ConfigRepository,
    private systemMetadataRepository: SystemMetadataRepository,
    private maintenanceWebsocketRepository: MaintenanceWebsocketRepository,
    private maintenanceHealthRepository: MaintenanceHealthRepository,
    private storageRepository: StorageRepository,
    private processRepository: ProcessRepository,
    private databaseRepository: DatabaseRepository,
    private databaseBackupService: DatabaseBackupService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  mock(status: MaintenanceStatusResponseDto) {
    this.#secret = 'secret';
    this.#status = status;
  }

  async init() {
    const state = (await this.systemMetadataRepository.get(
      SystemMetadataKey.MaintenanceMode,
    )) as MaintenanceModeState & { isMaintenanceMode: true };

    this.#secret = state.secret;
    this.#status = {
      active: true,
      action: state.action?.action ?? MaintenanceAction.Start,
    };

    StorageCore.setMediaLocation(this.detectMediaLocation());

    this.maintenanceWebsocketRepository.setAuthFn(async (client) => this.authenticate(client.request.headers));
    this.maintenanceWebsocketRepository.setStatusUpdateFn((status) => (this.#status = status));

    await this.logSecret();

    if (state.action) {
      void this.runAction(state.action);
    }
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
  getSystemConfig() {
    return {
      maintenanceMode: true,
    } as ServerConfigDto;
  }

  /**
   * {@link _VersionService.getVersion}
   */
  getVersion() {
    return ServerVersionResponseDto.fromSemVer(serverVersion);
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

  private get secret() {
    if (!this.#secret) {
      throw new Error('Secret is not initialised yet.');
    }

    return this.#secret;
  }

  private get backupRepos() {
    return {
      logger: this.logger,
      storage: this.storageRepository,
      config: this.configRepository,
      process: this.processRepository,
      database: this.databaseRepository,
      health: this.maintenanceHealthRepository,
    };
  }

  private getStatus(): MaintenanceStatusResponseDto {
    return this.#status;
  }

  private getPublicStatus(): MaintenanceStatusResponseDto {
    const state = structuredClone(this.#status);

    if (state.error) {
      state.error = 'Something went wrong, see logs!';
    }

    return state;
  }

  setStatus(status: MaintenanceStatusResponseDto): void {
    this.#status = status;
    this.maintenanceWebsocketRepository.serverSend('MaintenanceStatus', status);
    this.maintenanceWebsocketRepository.clientSend('MaintenanceStatusV1', 'private', status);
    this.maintenanceWebsocketRepository.clientSend('MaintenanceStatusV1', 'public', this.getPublicStatus());
  }

  async logSecret(): Promise<void> {
    const { server } = await this.getConfig({ withCache: true });

    const baseUrl = getExternalDomain(server);
    const url = await createMaintenanceLoginUrl(
      baseUrl,
      {
        username: 'immich-admin',
      },
      this.secret,
    );

    this.logger.log(`\n\n🚧 Immich is in maintenance mode, you can log in using the following URL:\n${url}\n`);
  }

  async authenticate(headers: IncomingHttpHeaders): Promise<MaintenanceAuthDto> {
    const jwtToken = parse(headers.cookie || '')[ImmichCookie.MaintenanceToken];
    return this.login(jwtToken);
  }

  async status(potentiallyJwt?: string): Promise<MaintenanceStatusResponseDto> {
    try {
      await this.login(potentiallyJwt);
      return this.getStatus();
    } catch {
      return this.getPublicStatus();
    }
  }

  detectPriorInstall(): Promise<MaintenanceDetectInstallResponseDto> {
    return detectPriorInstall(this.storageRepository);
  }

  async login(jwt?: string): Promise<MaintenanceAuthDto> {
    if (!jwt) {
      throw new UnauthorizedException('Missing JWT Token');
    }

    try {
      const result = await jwtVerify<MaintenanceAuthDto>(jwt, new TextEncoder().encode(this.secret));
      return result.payload;
    } catch {
      throw new UnauthorizedException('Invalid JWT Token');
    }
  }

  async setAction(action: SetMaintenanceModeDto) {
    this.setStatus({
      active: true,
      action: action.action,
    });

    await this.runAction(action);
  }

  async runAction(action: SetMaintenanceModeDto) {
    switch (action.action) {
      case MaintenanceAction.Start: {
        return;
      }
      case MaintenanceAction.End: {
        return this.endMaintenance();
      }
      case MaintenanceAction.SelectDatabaseRestore: {
        return;
      }
    }

    const lock = await this.databaseRepository.tryLock(DatabaseLock.MaintenanceOperation);
    if (!lock) {
      return;
    }

    this.logger.log(`Running maintenance action ${action.action}`);

    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, {
      isMaintenanceMode: true,
      secret: this.secret,
      action: {
        action: MaintenanceAction.Start,
      },
    });

    try {
      if (!action.restoreBackupFilename) {
        throw new Error("Expected restoreBackupFilename but it's missing!");
      }

      await this.restoreBackup(action.restoreBackupFilename);
    } catch (error) {
      this.logger.error(`Encountered error running action: ${error}`);
      this.setStatus({
        active: true,
        action: action.action,
        task: 'error',
        error: '' + error,
      });
    }
  }

  private async restoreBackup(filename: string): Promise<void> {
    this.setStatus({
      active: true,
      action: MaintenanceAction.RestoreDatabase,
      task: 'ready',
      progress: 0,
    });

    await this.databaseBackupService.restoreDatabaseBackup(filename, (task, progress) =>
      this.setStatus({
        active: true,
        action: MaintenanceAction.RestoreDatabase,
        progress,
        task,
      }),
    );

    await this.setAction({
      action: MaintenanceAction.End,
    });
  }

  private async endMaintenance(): Promise<void> {
    const state: MaintenanceModeState = { isMaintenanceMode: false as const };
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);

    // => corresponds to notification.service.ts#onAppRestart
    this.maintenanceWebsocketRepository.clientBroadcast('AppRestartV1', state);
    this.maintenanceWebsocketRepository.serverSend('AppRestart', state);
    this.appRepository.exitApp();
  }
}
