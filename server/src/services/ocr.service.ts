import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import {
  JobName,
  JobStatus,
  QueueName,
} from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { getAssetFiles } from 'src/utils/asset.util';
import { isOcrEnabled } from 'src/utils/misc';

@Injectable()
export class OcrService extends BaseService {
  @OnJob({ name: JobName.OCR_CLEANUP, queue: QueueName.BACKGROUND_TASK })
  async handleOcrCleanup(): Promise<JobStatus> {
    const ocr = await this.ocrRepository.getOcrWithoutText();
    await this.ocrRepository.delete(ocr);
    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.QUEUE_OCR, queue: QueueName.OCR })
  async handleQueueOcr({ force, nightly }: JobOf<JobName.QUEUE_OCR>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isOcrEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    if (force) {
      await this.ocrRepository.deleteAllOcr();
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

    if (force === undefined) {
      await this.jobRepository.queue({ name: JobName.OCR_CLEANUP });
    }

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.OCR, queue: QueueName.OCR })
  async handleOcr({ id }: JobOf<JobName.OCR>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isOcrEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const relations = { files: true };
    const asset = await this.assetRepository.getById(id, relations);
    if (!asset) {
      return JobStatus.FAILED;
    }
    if (!asset.files) {
      return JobStatus.FAILED;
    }
    const { previewFile } = getAssetFiles(asset.files);
    if (!previewFile) {
      return JobStatus.FAILED;
    }
    const ocrResults = await this.machineLearningRepository.ocr(
      machineLearning.urls,
      previewFile.path,
      machineLearning.ocr
    );

    if (!ocrResults || ocrResults.text.length === 0) {
      this.logger.warn(`No OCR results for document ${id}`);
      await this.assetRepository.upsertJobStatus({
        assetId: asset.id,
        ocrAt: new Date(),
      });
      return JobStatus.SUCCESS;
    }

    this.logger.debug(`OCR ${id} has OCR results`);

    const ocr = await this.ocrRepository.getOcrById(id);
    if (ocr) {
      this.logger.debug(`Updating OCR for ${id}`);
      await this.ocrRepository.updateOcrData(id, ocrResults.text);
    } else {
      this.logger.debug(`Inserting OCR for ${id}`);
      await this.ocrRepository.insertOcrData(id, ocrResults.text);
    }

    await this.assetRepository.upsertJobStatus({
      assetId: asset.id,
      ocrAt: new Date(),
    });
    this.logger.debug(`Processed OCR for ${id}`);
    return JobStatus.SUCCESS;
  }

}