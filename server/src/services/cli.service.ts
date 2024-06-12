import { Inject, Injectable } from '@nestjs/common';
import { SALT_ROUNDS } from 'src/constants';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { UserAdminResponseDto, mapUserAdmin } from 'src/dtos/user.dto';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';

@Injectable()
export class CliService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(CliService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
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
    const password = providedPassword || this.cryptoRepository.newPassword(24);
    const hashedPassword = await this.cryptoRepository.hashBcrypt(password, SALT_ROUNDS);

    await this.userRepository.update(admin.id, { password: hashedPassword });

    return { admin, password, provided: !!providedPassword };
  }

  async disablePasswordLogin(): Promise<void> {
    const config = await this.configCore.getConfig({ withCache: false });
    config.passwordLogin.enabled = false;
    await this.configCore.updateConfig(config);
  }

  async enablePasswordLogin(): Promise<void> {
    const config = await this.configCore.getConfig({ withCache: false });
    config.passwordLogin.enabled = true;
    await this.configCore.updateConfig(config);
  }

  async disableOAuthLogin(): Promise<void> {
    const config = await this.configCore.getConfig({ withCache: false });
    config.oauth.enabled = false;
    await this.configCore.updateConfig(config);
  }

  async enableOAuthLogin(): Promise<void> {
    const config = await this.configCore.getConfig({ withCache: false });
    config.oauth.enabled = true;
    await this.configCore.updateConfig(config);
  }
}
