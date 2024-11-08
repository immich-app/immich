import { Inject, Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob, CronTime } from 'cron';
import { CronCreate, CronUpdate, ICronRepository } from 'src/interfaces/cron.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';

@Injectable()
export class CronRepository implements ICronRepository {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(CronRepository.name);
  }

  create({ name, expression, onTick, start = true }: CronCreate): void {
    const job = new CronJob<null, null>(
      expression,
      onTick,
      // function to run onComplete
      undefined,
      // whether it should start directly
      start,
      // timezone
      undefined,
      // context
      undefined,
      // runOnInit
      undefined,
      // utcOffset
      undefined,
      // prevents memory leaking by automatically stopping when the node process finishes
      true,
    );

    this.schedulerRegistry.addCronJob(name, job);
  }

  update({ name, expression, start }: CronUpdate): void {
    const job = this.schedulerRegistry.getCronJob(name);
    if (expression) {
      job.setTime(new CronTime(expression));
    }
    if (start !== undefined) {
      if (start) {
        job.start();
      } else {
        job.stop();
      }
    }
  }
}
