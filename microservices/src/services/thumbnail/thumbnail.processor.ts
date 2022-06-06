import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EntityManager } from 'typeorm';
import sharp from 'sharp';
@Processor('thumbnail-queue')
export class ThumbnailProcessor {

  constructor(private entityManager: EntityManager) {

  }

  @Process('generate-thumbnail')
  async generateThumbnail(job: Job) {
    // console.log("Run Generate Thumbnail Job 12", job.data)

    // const res = await this.entityManager.query(`select count(*) from assets`);

    // console.log(res);
  }


  @Process('generate-webp-thumbnail')
  async generateWebpThumbnail(job: Job) {
    console.log("Run Generate Thumbnail Job 12", job.data)

    // const resizePath = 'asset.resizePath';
    // if (resizePath != '') {
    //   const webpPath = resizePath.replace('jpeg', 'webp')

    //   sharp(resizePath).resize(250).webp().toFile(webpPath, (err, info) => {

    //     if (!err) {
    //       this.assetRepository.update({ id: asset.id }, { webpPath: webpPath })
    //     }

    //   });
    // }
  }
}