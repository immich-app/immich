import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { AssetModule } from '../asset/asset.module';

@Module({
  imports: [AssetModule],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
