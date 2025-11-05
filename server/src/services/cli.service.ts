import { Injectable } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { isAbsolute } from 'node:path';
import { Server } from 'socket.io';
import { SALT_ROUNDS } from 'src/constants';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { UserAdminResponseDto, mapUserAdmin } from 'src/dtos/user.dto';
import { type ArgsOf } from 'src/repositories/event.repository';
import { type ServerEvents } from 'src/repositories/websocket.repository';
import { BaseService } from 'src/services/base.service';
import { getExternalDomain } from 'src/utils/misc';

@Injectable()
export class CliService extends BaseService {
  private oneShotServerSend<T extends ServerEvents>(event: T, ...args: ArgsOf<T>): void {
    const server = new Server();
    const pubClient = new Redis(this.configRepository.getEnv().redis);
    const subClient = pubClient.duplicate();
    server.adapter(createAdapter(pubClient, subClient));
    server.serverSideEmit(event, ...args, () => {
      pubClient.disconnect();
      subClient.disconnect();
    });
  }

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
    const currentState = await this.maintenanceRepository.getMaintenanceMode();
    if (!currentState.isMaintenanceMode) {
      return {
        alreadyDisabled: true,
      };
    }

    const state = { isMaintenanceMode: false as const };
    await this.maintenanceRepository.setMaintenanceMode(state);
    this.oneShotServerSend('AppRestart', state);

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

    const state = await this.maintenanceRepository.getMaintenanceMode();
    if (state.isMaintenanceMode) {
      const secret = new TextEncoder().encode(state.secret);

      return {
        authUrl: await this.maintenanceRepository.createLoginUrl(baseUrl, payload, secret),
        alreadyEnabled: true,
      };
    }

    const { secret } = await this.maintenanceRepository.enterMaintenanceMode();

    this.oneShotServerSend('AppRestart', {
      isMaintenanceMode: true,
    });

    return {
      authUrl: await this.maintenanceRepository.createLoginUrl(baseUrl, payload, secret),
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
