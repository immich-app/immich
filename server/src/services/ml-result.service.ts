import { Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { OnEvent } from 'src/decorators';
import { ImmichWorker, JobName } from 'src/enum';
import { Face, OCR } from 'src/repositories/machine-learning.repository';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { FaceSearchTable } from 'src/schema/tables/face-search.table';
import { BaseService } from 'src/services/base.service';
import { MlStreamTask, MlWorkResult } from 'src/types';
import { tokenizeForSearch } from 'src/utils/database';

interface ClipResult {
  embedding: string;
}

interface FaceResult {
  faces: Face[];
  imageHeight: number;
  imageWidth: number;
}

interface OcrResult extends OCR {}

@Injectable()
export class MlResultService extends BaseService {

  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Microservices] })
  async onBootstrap(): Promise<void> {
    const { machineLearning } = await this.getConfig({ withCache: false });

    // Only start if stream mode is enabled
    if (!machineLearning.streamMode?.enabled) {
      this.logger.log('ML stream mode is disabled, skipping result consumer');
      return;
    }

    await this.mlStreamRepository.setup();
    this.mlStreamRepository.startResultConsumer((result) => this.handleResult(result));
    this.logger.log('Started ML result consumer');
  }

  @OnEvent({ name: 'AppShutdown', workers: [ImmichWorker.Microservices] })
  async onShutdown(): Promise<void> {
    this.mlStreamRepository.stopResultConsumer();
  }

  private async handleResult(result: MlWorkResult): Promise<void> {
    if (result.status === 'error') {
      await this.handleError(result);
      return;
    }

    try {
      switch (result.taskType) {
        case MlStreamTask.Clip:
          await this.handleClipResult(result);
          break;
        case MlStreamTask.Face:
          await this.handleFaceResult(result);
          break;
        case MlStreamTask.Ocr:
          await this.handleOcrResult(result);
          break;
        default:
          this.logger.warn(`Unknown task type: ${result.taskType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process ${result.taskType} result for asset ${result.assetId}: ${error}`);
    }
  }

  private async handleClipResult(result: MlWorkResult): Promise<void> {
    const clipResult = result.result as ClipResult;
    if (!clipResult?.embedding) {
      this.logger.warn(`Invalid CLIP result for asset ${result.assetId}`);
      return;
    }

    await this.searchRepository.upsert(result.assetId, clipResult.embedding);
    await this.assetRepository.upsertJobStatus({ assetId: result.assetId, smartSearchAt: new Date() });

    this.logger.debug(`Saved CLIP embedding for asset ${result.assetId} (${result.processingTimeMs}ms)`);
  }

  private async handleFaceResult(result: MlWorkResult): Promise<void> {
    const faceResult = result.result as FaceResult;
    if (!faceResult?.faces) {
      this.logger.warn(`Invalid face result for asset ${result.assetId}`);
      return;
    }

    const { faces, imageHeight, imageWidth } = faceResult;

    const facesToAdd: (Insertable<AssetFaceTable> & { assetId: string })[] = [];
    const embeddings: Insertable<FaceSearchTable>[] = [];

    for (const { boundingBox, embedding } of faces) {
      const faceId = this.cryptoRepository.randomUUID();
      facesToAdd.push({
        id: faceId,
        assetId: result.assetId,
        imageHeight,
        imageWidth,
        boundingBoxX1: boundingBox.x1,
        boundingBoxY1: boundingBox.y1,
        boundingBoxX2: boundingBox.x2,
        boundingBoxY2: boundingBox.y2,
      });
      embeddings.push({ faceId, embedding });
    }

    if (facesToAdd.length > 0 || embeddings.length > 0) {
      await this.personRepository.refreshFaces(facesToAdd, [], embeddings);
    }

    if (facesToAdd.length > 0) {
      const jobs = facesToAdd.map((face) => ({
        name: JobName.FacialRecognition as const,
        data: { id: face.id as string }, // id is always set explicitly above
      }));
      await this.jobRepository.queueAll([
        { name: JobName.FacialRecognitionQueueAll, data: { force: false } },
        ...jobs,
      ]);
    }

    await this.assetRepository.upsertJobStatus({ assetId: result.assetId, facesRecognizedAt: new Date() });

    this.logger.debug(
      `Saved ${faces.length} face(s) for asset ${result.assetId} (${result.processingTimeMs}ms)`,
    );
  }

  private async handleOcrResult(result: MlWorkResult): Promise<void> {
    const ocrResult = result.result as OcrResult;
    if (!ocrResult) {
      this.logger.warn(`Invalid OCR result for asset ${result.assetId}`);
      return;
    }

    const { ocrDataList, searchText } = this.parseOcrResults(result.assetId, ocrResult);
    await this.ocrRepository.upsert(result.assetId, ocrDataList, searchText);
    await this.assetRepository.upsertJobStatus({ assetId: result.assetId, ocrAt: new Date() });

    this.logger.debug(
      `Saved ${ocrResult.text.length} OCR result(s) for asset ${result.assetId} (${result.processingTimeMs}ms)`,
    );
  }

  private parseOcrResults(assetId: string, { box, boxScore, text, textScore }: OCR) {
    const ocrDataList = [];
    const searchTokens = [];
    for (let i = 0; i < text.length; i++) {
      const rawText = text[i];
      const boxOffset = i * 8;
      ocrDataList.push({
        assetId,
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

  private async handleError(result: MlWorkResult): Promise<void> {
    this.logger.error(
      `ML ${result.taskType} failed for asset ${result.assetId}: ${result.error?.message} (${result.error?.code})`,
    );

    // Could implement retry logic here or move to dead letter queue
    // For now, just log the error - the original job will be retried by BullMQ
  }
}
