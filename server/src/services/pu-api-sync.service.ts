import { Injectable } from '@nestjs/common';
import { OnEvent } from 'src/decorators';
import { PuApiRepository } from 'src/repositories/pu-api.repository';

@Injectable()
export class PuApiSyncService {
  constructor(private puApiRepository: PuApiRepository) {}

  @OnEvent({ name: 'UserCreate' })
  async onUserCreate() {
    await this.puApiRepository.syncTenantUsers();
  }

  @OnEvent({ name: 'UserUpdate' })
  async onUserUpdate() {
    await this.puApiRepository.syncTenantUsers();
  }

  @OnEvent({ name: 'UserTrash' })
  async onUserTrash() {
    await this.puApiRepository.syncTenantUsers();
  }

  @OnEvent({ name: 'UserRestore' })
  async onUserRestore() {
    await this.puApiRepository.syncTenantUsers();
  }

  @OnEvent({ name: 'UserDelete' })
  async onUserDelete() {
    await this.puApiRepository.syncTenantUsers();
  }
}
