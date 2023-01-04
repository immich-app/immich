import { APP_UPLOAD_LOCATION, userUtils } from '@app/common';
import { APIKeyEntity, AssetEntity, UserEntity } from '@app/database';
import { QueueNameEnum, userDeletionProcessorName } from '@app/job';
import { IUserDeletionJob } from '@app/job/interfaces/user-deletion.interface';
import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { join } from 'path';
import fs from 'fs';
import { Repository } from 'typeorm';

@Processor(QueueNameEnum.USER_DELETION)
export class UserDeletionProcessor {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(APIKeyEntity)
    private apiKeyRepository: Repository<APIKeyEntity>,
  ) {}

  @Process(userDeletionProcessorName)
  async processUserDeletion(job: Job<IUserDeletionJob>) {
    const { user } = job.data;
    // just for extra protection here
    if (userUtils.isReadyForDeletion(user)) {
      const basePath = APP_UPLOAD_LOCATION;
      const userAssetDir = join(basePath, user.id);
      fs.rmSync(userAssetDir, { recursive: true, force: true });
      await this.apiKeyRepository.delete({ userId: user.id });
      await this.assetRepository.delete({ userId: user.id });
      await this.userRepository.remove(user);
    }
  }
}
