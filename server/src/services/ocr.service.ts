import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { isOcrEnabled } from 'src/utils/misc';

@Injectable()
export class OcrService extends BaseService {
  @OnJob({ name: JobName.QUEUE_OCR, queue: QueueName.OCR })
  async handleQueueOcr({ force, nightly }: JobOf<JobName.QUEUE_OCR>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isOcrEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    if (force) {
      await this.ocrRepository.deleteAll();
    }

    let jobs: JobItem[] = [];
    const assets = this.assetJobRepository.streamForOcrJob(force);

    for await (const asset of assets) {
      jobs.push({ name: JobName.OCR, data: { id: asset.id } });

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);
    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.OCR, queue: QueueName.OCR })
  async handleOcr({ id }: JobOf<JobName.OCR>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isOcrEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const asset = await this.assetJobRepository.getForOcr(id);
    if (!asset || !asset.previewFile) {
      return JobStatus.FAILED;
    }

    if (asset.visibility === AssetVisibility.HIDDEN) {
      return JobStatus.SKIPPED;
    }

    const ocrResults = await this.machineLearningRepository.ocr(
      machineLearning.urls,
      asset.previewFile,
      machineLearning.ocr,
    );

    if (ocrResults.length > 0) {
      const ocrDataList = ocrResults.map((result) => ({
        assetId: id,
        x1: result.x1,
        y1: result.y1,
        x2: result.x2,
        y2: result.y2,
        x3: result.x3,
        y3: result.y3,
        x4: result.x4,
        y4: result.y4,
        text: result.text,
        confidence: result.confidence,
      }));

      await this.ocrRepository.upsert(id, ocrDataList);
    }

    await this.assetRepository.upsertJobStatus({ assetId: id, ocrAt: new Date() });

    this.logger.debug(`Processed ${ocrResults.length} OCR result(s) for ${id}`);
    return JobStatus.SUCCESS;
  }
}
