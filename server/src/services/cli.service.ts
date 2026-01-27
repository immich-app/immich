import { Injectable } from '@nestjs/common';
import { isAbsolute } from 'node:path';
import { SALT_ROUNDS } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { UserAdminResponseDto, mapUserAdmin } from 'src/dtos/user.dto';
import { AssetFileType, MaintenanceAction, SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { createMaintenanceLoginUrl, generateMaintenanceSecret } from 'src/utils/maintenance';
import { getExternalDomain } from 'src/utils/misc';
import { mimeTypes } from 'src/utils/mime-types';

@Injectable()
export class CliService extends BaseService {
  async listUsers(): Promise<UserAdminResponseDto[]> {
    const users = await this.userRepository.getList({ withDeleted: true });
    return users.map((user) => mapUserAdmin(user));
  }

  async resetAdminPassword(ask: (admin: UserAdminResponseDto) => Promise<string | undefined>) {
    const admin = await this.userRepository.getAdmin();
    if (!admin) {
      throw new Error('Admin account does not exist');
    }

    const providedPassword = await ask(mapUserAdmin(admin));
    const password = providedPassword || this.cryptoRepository.randomBytesAsText(24);
    const hashedPassword = await this.cryptoRepository.hashBcrypt(password, SALT_ROUNDS);

    await this.userRepository.update(admin.id, { password: hashedPassword });

    return { admin, password, provided: !!providedPassword };
  }

  async disablePasswordLogin(): Promise<void> {
    const config = await this.getConfig({ withCache: false });
    config.passwordLogin.enabled = false;
    await this.updateConfig(config);
  }

  async enablePasswordLogin(): Promise<void> {
    const config = await this.getConfig({ withCache: false });
    config.passwordLogin.enabled = true;
    await this.updateConfig(config);
  }

  async disableMaintenanceMode(): Promise<{ alreadyDisabled: boolean }> {
    const currentState = await this.systemMetadataRepository
      .get(SystemMetadataKey.MaintenanceMode)
      .then((state) => state ?? { isMaintenanceMode: false as const });

    if (!currentState.isMaintenanceMode) {
      return {
        alreadyDisabled: true,
      };
    }

    const state = { isMaintenanceMode: false as const };
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    await this.appRepository.sendOneShotAppRestart(state);

    return {
      alreadyDisabled: false,
    };
  }

  async enableMaintenanceMode(): Promise<{ authUrl: string; alreadyEnabled: boolean }> {
    const { server } = await this.getConfig({ withCache: true });
    const baseUrl = getExternalDomain(server);

    const payload: MaintenanceAuthDto = {
      username: 'cli-admin',
    };

    const state = await this.systemMetadataRepository
      .get(SystemMetadataKey.MaintenanceMode)
      .then((state) => state ?? { isMaintenanceMode: false as const });

    if (state.isMaintenanceMode) {
      return {
        authUrl: await createMaintenanceLoginUrl(baseUrl, payload, state.secret),
        alreadyEnabled: true,
      };
    }

    const secret = generateMaintenanceSecret();

    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, {
      isMaintenanceMode: true,
      secret,
      action: {
        action: MaintenanceAction.Start,
      },
    });

    await this.appRepository.sendOneShotAppRestart({
      isMaintenanceMode: true,
    });

    return {
      authUrl: await createMaintenanceLoginUrl(baseUrl, payload, secret),
      alreadyEnabled: false,
    };
  }

  async grantAdminAccess(email: string): Promise<void> {
    const user = await this.userRepository.getByEmail(email);
    if (!user) {
      throw new Error('User does not exist');
    }

    await this.userRepository.update(user.id, { isAdmin: true });
  }

  async revokeAdminAccess(email: string): Promise<void> {
    const user = await this.userRepository.getByEmail(email);
    if (!user) {
      throw new Error('User does not exist');
    }

    await this.userRepository.update(user.id, { isAdmin: false });
  }

  async disableOAuthLogin(): Promise<void> {
    const config = await this.getConfig({ withCache: false });
    config.oauth.enabled = false;
    await this.updateConfig(config);
  }

  async enableOAuthLogin(): Promise<void> {
    const config = await this.getConfig({ withCache: false });
    config.oauth.enabled = true;
    await this.updateConfig(config);
  }

  async getSampleFilePaths(): Promise<string[]> {
    const [assets, people, users] = await Promise.all([
      this.assetRepository.getFileSamples(),
      this.personRepository.getFileSamples(),
      this.userRepository.getFileSamples(),
    ]);

    const paths = [];

    for (const person of people) {
      paths.push(person.thumbnailPath);
    }

    for (const user of users) {
      paths.push(user.profileImagePath);
    }

    for (const asset of assets) {
      paths.push(asset.path);
    }

    return paths.filter(Boolean) as string[];
  }

  async migrateFilePaths({
    oldValue,
    newValue,
    confirm,
  }: {
    oldValue: string;
    newValue: string;
    confirm: (data: { sourceFolder: string; targetFolder: string }) => Promise<boolean>;
  }): Promise<boolean> {
    let sourceFolder = oldValue;
    if (sourceFolder.startsWith('./')) {
      sourceFolder = sourceFolder.slice(2);
    }

    const targetFolder = newValue;
    if (!isAbsolute(targetFolder)) {
      throw new Error('Target media location must be an absolute path');
    }

    if (!(await confirm({ sourceFolder, targetFolder }))) {
      return false;
    }

    await this.databaseRepository.migrateFilePaths(sourceFolder, targetFolder);

    return true;
  }

  cleanup() {
    return this.databaseRepository.shutdown();
  }

  getDefaultThumbnailStoragePath(): string {
    const envData = this.configRepository.getEnv();
    if (envData.thumbnailStorage.sqlitePath) {
      return envData.thumbnailStorage.sqlitePath;
    }

    const mediaLocation = envData.storage.mediaLocation ?? this.detectMediaLocation();
    StorageCore.setMediaLocation(mediaLocation);
    return StorageCore.getThumbnailStoragePath();
  }

  private detectMediaLocation(): string {
    const candidates = ['/data', '/usr/src/app/upload'];
    for (const candidate of candidates) {
      if (this.storageRepository.existsSync(candidate)) {
        return candidate;
      }
    }
    return '/usr/src/app/upload';
  }

  async migrateThumbnailsToSqlite(options: {
    sqlitePath: string;
    onProgress: (progress: { current: number; migrated: number; skipped: number; errors: number }) => void;
  }): Promise<{ total: number; migrated: number; skipped: number; errors: number }> {
    const { sqlitePath, onProgress } = options;

    if (!isAbsolute(sqlitePath)) {
      throw new Error('SQLite path must be an absolute path');
    }

    this.thumbnailStorageRepository.initialize(sqlitePath);

    let current = 0;
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for await (const file of this.assetJobRepository.streamAllThumbnailFiles()) {
      current++;

      try {
        const existingData = this.thumbnailStorageRepository.get(
          file.assetId,
          file.type as AssetFileType,
          file.isEdited,
        );

        if (existingData) {
          skipped++;
          onProgress({ current, migrated, skipped, errors });
          continue;
        }

        const fileExists = await this.storageRepository.checkFileExists(file.path);
        if (!fileExists) {
          skipped++;
          onProgress({ current, migrated, skipped, errors });
          continue;
        }

        const data = await this.storageRepository.readFile(file.path);
        const mimeType = mimeTypes.lookup(file.path) || 'image/jpeg';

        this.thumbnailStorageRepository.store({
          assetId: file.assetId,
          type: file.type as AssetFileType,
          isEdited: file.isEdited,
          data,
          mimeType,
        });

        migrated++;
      } catch (error) {
        errors++;
        this.logger.error(`Failed to migrate thumbnail for asset ${file.assetId}: ${error}`);
      }

      onProgress({ current, migrated, skipped, errors });
    }

    return { total: current, migrated, skipped, errors };
  }
}
