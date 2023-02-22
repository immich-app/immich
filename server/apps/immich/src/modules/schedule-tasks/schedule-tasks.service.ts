import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { UserEntity } from '@app/infra';
import { userUtils } from '@app/common';
import { IJobRepository, JobName } from '@app/domain';

@Injectable()
export class ScheduleTasksService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {}
  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async deleteUserAndRelatedAssets() {
    const usersToDelete = await this.userRepository.find({ withDeleted: true, where: { deletedAt: Not(IsNull()) } });
    for (const user of usersToDelete) {
      if (userUtils.isReadyForDeletion(user)) {
        await this.jobRepository.add({ name: JobName.USER_DELETION, data: { user } });
      }
    }
  }
}
