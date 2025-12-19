import { Injectable } from '@nestjs/common';
import { isAbsolute } from 'node:path';
import { SALT_ROUNDS } from 'src/constants';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { UserAdminResponseDto, mapUserAdmin } from 'src/dtos/user.dto';
import { SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { createMaintenanceLoginUrl, generateMaintenanceSecret } from 'src/utils/maintenance';
import { getExternalDomain } from 'src/utils/misc';

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
}
