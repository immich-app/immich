import { Module } from '@nestjs/common';
import { DownloadService } from './download.service';

@Module({
  providers: [DownloadService],
  exports: [DownloadService],
})
export class DownloadModule {}
