import { Injectable } from '@nestjs/common';
import { OnEvent } from 'src/decorators';
import { BootstrapEventPriority, ImmichWorker, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class QueueService extends BaseService {
  @OnEvent({
    name: 'app.bootstrap',
    priority: BootstrapEventPriority.JobService,
    workers: [ImmichWorker.Microservices],
  })
  async onBootstrap() {
    this.jobRepository.setConcurrency(QueueName.BackgroundTask, 5);
  }
}
