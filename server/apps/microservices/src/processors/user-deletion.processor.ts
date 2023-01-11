import { APP_UPLOAD_LOCATION, userUtils } from '@app/common';
import { APIKeyEntity, AssetEntity, UserEntity } from '@app/infra';
import { QueueNameEnum, userDeletionProcessorName } from '@app/job';
import { IUserDeletionJob } from '@app/job/interfaces/user-deletion.interface';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { join } from 'path';
import fs from 'fs';
import { Repository } from 'typeorm';

@Processor(QueueNameEnum.USER_DELETION)
export class UserDeletionProcessor {
  private logger = new Logger(UserDeletionProcessor.name);

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
    if (!userUtils.isReadyForDeletion(user)) {
      this.logger.warn(`Skipped user that was not ready for deletion: id=${user.id}`);
      return;
    }

    this.logger.log(`Deleting user: ${user.id}`);

    try {
      const basePath = APP_UPLOAD_LOCATION;
      const userAssetDir = join(basePath, user.id);
      this.logger.warn(`Removing user from filesystem: ${userAssetDir}`);
      fs.rmSync(userAssetDir, { recursive: true, force: true });

      this.logger.warn(`Removing user from database: ${user.id}`);
      await this.apiKeyRepository.delete({ userId: user.id });
      await this.assetRepository.delete({ userId: user.id });
      await this.userRepository.remove(user);
    } catch (error: any) {
      this.logger.error(`Failed to remove user`);
      this.logger.error(error, error?.stack);
      throw error;
    }
  }
}
