import { Injectable } from '@nestjs/common';
import { SALT_ROUNDS } from 'src/constants';
import { UserAdminResponseDto, mapUserAdmin } from 'src/dtos/user.dto';
import { BaseService } from 'src/services/base.service';

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

  cleanup() {
    return this.databaseRepository.shutdown();
  }
}
