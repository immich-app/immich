import { assetUtils, userUtils } from '@app/common';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { QueueNameEnum, userDeletionProcessorName } from '@app/job';
import { IUserDeletionJob } from '@app/job/interfaces/user-deletion.interface';
import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';

@Processor(QueueNameEnum.USER_DELETION)
export class UserDeletionProcessor {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  @Process(userDeletionProcessorName)
  async processUserDeletion(job: Job<IUserDeletionJob>) {
    const { user } = job.data;
    const userAssets = await this.assetRepository.find({ where: { userId: user.id } });
    // just for extra protection here
    if (userUtils.isReadyForDeletion(user)) {
      for (const asset of userAssets) {
        assetUtils.deleteFiles(asset);
        this.assetRepository.remove(asset);
      }
      this.userRepository.remove(user);
    }
  }
}
