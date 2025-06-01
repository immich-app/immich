import { Injectable } from '@nestjs/common';
import { SALT_ROUNDS } from 'src/constants';
import { UserAdminResponseDto, mapUserAdmin } from 'src/dtos/user.dto';
import { BaseService } from 'src/services/base.service';
import { Permission } from 'src/enum';

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

  async generateApiKey(name: string, userId: string): Promise<string> {
    const apiKey = this.cryptoRepository.newPassword(32);
    const hash = this.cryptoRepository.hashSha256(apiKey); // Generate a random 32-character key
    const dto = {
      key: hash,
      name,
      userId,
      permissions: [
        Permission.JOBS_READ,
        Permission.JOBS_CREATE,
        Permission.JOBS_UPDATE,
        Permission.JOBS_DELETE,
      ], // Grant permissions to access the jobs API endpoints
      createdAt: new Date(),
    };
    await this.apiKeyRepository.create(dto); // Save the key using the create method
    return apiKey;
  }

  async getFirstAdminUserId(): Promise<string> {
    const admin = await this.userRepository.getAdmin();
    if (!admin) {
      throw new Error('No admin user found');
    }
    console.log(admin)
    return admin.id;
  }

  cleanup() {
    return this.databaseRepository.shutdown();
  }
}
