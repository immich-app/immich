import { Inject, Injectable } from '@nestjs/common';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { UserCore } from 'src/cores/user.core';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';

@Injectable()
export class CliService {
  private configCore: SystemConfigCore;
  private userCore: UserCore;

  constructor(
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.userCore = UserCore.create(cryptoRepository, userRepository);
    this.logger.setContext(CliService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
  }

  async listUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.getList({ withDeleted: true });
    return users.map((user) => mapUser(user));
  }

  async resetAdminPassword(ask: (admin: UserResponseDto) => Promise<string | undefined>) {
    const admin = await this.userRepository.getAdmin();
    if (!admin) {
      throw new Error('Admin account does not exist');
    }

    const providedPassword = await ask(mapUser(admin));
    const password = providedPassword || this.cryptoRepository.newPassword(24);

    await this.userCore.updateUser(admin, admin.id, { password });

    return { admin, password, provided: !!providedPassword };
  }

  async disablePasswordLogin(): Promise<void> {
    const config = await this.configCore.getConfig();
    config.passwordLogin.enabled = false;
    await this.configCore.updateConfig(config);
  }

  async enablePasswordLogin(): Promise<void> {
    const config = await this.configCore.getConfig();
    config.passwordLogin.enabled = true;
    await this.configCore.updateConfig(config);
  }

  async disableOAuthLogin(): Promise<void> {
    const config = await this.configCore.getConfig();
    config.oauth.enabled = false;
    await this.configCore.updateConfig(config);
  }

  async enableOAuthLogin(): Promise<void> {
    const config = await this.configCore.getConfig();
    config.oauth.enabled = true;
    await this.configCore.updateConfig(config);
  }
}
