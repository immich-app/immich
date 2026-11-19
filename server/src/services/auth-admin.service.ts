import { Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto.js';
import { Resource } from 'src/resource-paths.js';
import { BaseService } from 'src/services/base.service.js';

@Injectable()
export class AuthAdminService extends BaseService {
  async unlinkAll(_auth: AuthDto) {
    await this.userRepository.updateAll({ oauthId: null });
    const users = await this.userRepository.getList();
    this.resourceRepository.send({
      userIds: users.filter(({ isAdmin }) => isAdmin).map(({ id }) => id),
      changed: [Resource.adminUsers()],
    });
    this.resourceRepository.send({ userIds: users.map(({ id }) => id), changed: [Resource.myUser()] });
  }
}
