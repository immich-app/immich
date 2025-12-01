import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { OCR } from 'src/repositories/machine-learning.repository';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { tokenizeForSearch } from 'src/utils/database';
import { isOcrEnabled } from 'src/utils/misc';

@Injectable()
export class OcrService extends BaseService {
  @OnJob({ name: JobName.OcrQueueAll, queue: QueueName.Ocr })
  async handleQueueOcr({ force }: JobOf<JobName.OcrQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isOcrEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    if (force) {
      await this.ocrRepository.deleteAll();
    }

    let jobs: JobItem[] = [];
    const assets = this.assetJobRepository.streamForOcrJob(force);

    for await (const asset of assets) {
      jobs.push({ name: JobName.Ocr, data: { id: asset.id } });

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.Ocr, queue: QueueName.Ocr })
  async handleOcr({ id }: JobOf<JobName.Ocr>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isOcrEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForOcr(id);
    if (!asset || !asset.previewFile) {
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    const ocrResults = await this.machineLearningRepository.ocr(asset.previewFile, machineLearning.ocr);
    const { ocrDataList, searchText } = this.parseOcrResults(id, ocrResults);
    await this.ocrRepository.upsert(id, ocrDataList, searchText);

    await this.assetRepository.upsertJobStatus({ assetId: id, ocrAt: new Date() });

    this.logger.debug(`Processed ${ocrResults.text.length} OCR result(s) for ${id}`);
    return JobStatus.Success;
  }

  private parseOcrResults(id: string, { box, boxScore, text, textScore }: OCR) {
    const ocrDataList = [];
    const searchTokens = [];
    for (let i = 0; i < text.length; i++) {
      const rawText = text[i];
      const boxOffset = i * 8;
      ocrDataList.push({
        assetId: id,
        x1: box[boxOffset],
        y1: box[boxOffset + 1],
        x2: box[boxOffset + 2],
        y2: box[boxOffset + 3],
        x3: box[boxOffset + 4],
        y3: box[boxOffset + 5],
        x4: box[boxOffset + 6],
        y4: box[boxOffset + 7],
        boxScore: boxScore[i],
        textScore: textScore[i],
        text: rawText,
      });
      searchTokens.push(...tokenizeForSearch(rawText));
    }

    return { ocrDataList, searchText: searchTokens.join(' ') };
  }
}
