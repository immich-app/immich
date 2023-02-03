import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { TagModule } from '../tag/tag.module';

@Module({
  imports: [TagModule],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
