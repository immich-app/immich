import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('thumbnail-queue')
export class ThumbnailProcessor {


  @Process('generate-thumbnail')
  async generateThumbnail(job: Job) {
    console.log("Run Generate Thumbnail Job 12", job.data)
  }


  @Process('generate-webp-thumbnail')
  async generateWebpThumbnail(job: Job) {
    console.log("Run Generate Thumbnail Job 12", job.data)
  }
}