import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { S3AppStorageBackend } from 'src/storage/s3-backend';
import { ConfigRepository } from 'src/repositories/config.repository';
import { MACHINE_LEARNING_AVAILABILITY_BACKOFF_TIME, MACHINE_LEARNING_PING_TIMEOUT } from 'src/constants';
import { CLIPConfig } from 'src/dtos/model-config.dto';
import { LoggingRepository } from 'src/repositories/logging.repository';

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export enum ModelTask {
  FACIAL_RECOGNITION = 'facial-recognition',
  SEARCH = 'clip',
}

export enum ModelType {
  DETECTION = 'detection',
  PIPELINE = 'pipeline',
  RECOGNITION = 'recognition',
  TEXTUAL = 'textual',
  VISUAL = 'visual',
}

export type ModelPayload = { imagePath: string } | { text: string };

type ModelOptions = { modelName: string };

export type FaceDetectionOptions = ModelOptions & { minScore: number };

type VisualResponse = { imageHeight: number; imageWidth: number };
export type ClipVisualRequest = { [ModelTask.SEARCH]: { [ModelType.VISUAL]: ModelOptions } };
export type ClipVisualResponse = { [ModelTask.SEARCH]: string } & VisualResponse;

export type ClipTextualRequest = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: ModelOptions } };
export type ClipTextualResponse = { [ModelTask.SEARCH]: string };

export type FacialRecognitionRequest = {
  [ModelTask.FACIAL_RECOGNITION]: {
    [ModelType.DETECTION]: ModelOptions & { options: { minScore: number } };
    [ModelType.RECOGNITION]: ModelOptions;
  };
};

export interface Face {
  boundingBox: BoundingBox;
  embedding: string;
  score: number;
}

export type FacialRecognitionResponse = { [ModelTask.FACIAL_RECOGNITION]: Face[] } & VisualResponse;
export type DetectedFaces = { faces: Face[] } & VisualResponse;
export type MachineLearningRequest = ClipVisualRequest | ClipTextualRequest | FacialRecognitionRequest;
export type TextEncodingOptions = ModelOptions & { language?: string };

@Injectable()
export class MachineLearningRepository {
  // Note that deleted URL's are not removed from this map (ie: they're leaked)
  // Cleaning them up is low priority since there should be very few over a
  // typical server uptime cycle
  private urlAvailability: {
    [url: string]:
      | {
          active: boolean;
          lastChecked: number;
        }
      | undefined;
  };

  constructor(private logger: LoggingRepository, private configRepository: ConfigRepository) {
    this.logger.setContext(MachineLearningRepository.name);
    this.urlAvailability = {};
  }

  private setUrlAvailability(url: string, active: boolean) {
    const current = this.urlAvailability[url];
    if (current?.active !== active) {
      this.logger.verbose(`Setting ${url} ML server to ${active ? 'active' : 'inactive'}.`);
    }
    this.urlAvailability[url] = {
      active,
      lastChecked: Date.now(),
    };
  }

  private async checkAvailability(url: string) {
    let active = false;
    try {
      const response = await fetch(new URL('/ping', url), {
        signal: AbortSignal.timeout(MACHINE_LEARNING_PING_TIMEOUT),
      });
      active = response.ok;
    } catch {
      // nothing to do here
    }
    this.setUrlAvailability(url, active);
    return active;
  }

  private async shouldSkipUrl(url: string) {
    const availability = this.urlAvailability[url];
    if (availability === undefined) {
      // If this is a new endpoint, then check inline and skip if it fails
      if (!(await this.checkAvailability(url))) {
        return true;
      }
      return false;
    }
    if (!availability.active && Date.now() - availability.lastChecked < MACHINE_LEARNING_AVAILABILITY_BACKOFF_TIME) {
      // If this is an old inactive endpoint that hasn't been checked in a
      // while then check but don't wait for the result, just skip it
      // This avoids delays on every search whilst allowing higher priority
      // ML servers to recover over time.
      void this.checkAvailability(url);
      return true;
    }
    return false;
  }

  private async predict<T>(urls: string[], payload: ModelPayload, config: MachineLearningRequest): Promise<T> {
    const formData = await this.getFormData(payload, config);
    let urlCounter = 0;
    for (const url of urls) {
      urlCounter++;
      const isLast = urlCounter >= urls.length;
      if (!isLast && (await this.shouldSkipUrl(url))) {
        continue;
      }

      try {
        const response = await fetch(new URL('/predict', url), { method: 'POST', body: formData });
        if (response.ok) {
          this.setUrlAvailability(url, true);
          return response.json();
        }

        this.logger.warn(
          `Machine learning request to "${url}" failed with status ${response.status}: ${response.statusText}`,
        );
      } catch (error: Error | unknown) {
        this.logger.warn(
          `Machine learning request to "${url}" failed: ${error instanceof Error ? error.message : error}`,
        );
      }
      this.setUrlAvailability(url, false);
    }

    throw new Error(`Machine learning request '${JSON.stringify(config)}' failed for all URLs`);
  }

  async detectFaces(urls: string[], imagePath: string, { modelName, minScore }: FaceDetectionOptions) {
    const request = {
      [ModelTask.FACIAL_RECOGNITION]: {
        [ModelType.DETECTION]: { modelName, options: { minScore } },
        [ModelType.RECOGNITION]: { modelName },
      },
    };
    const response = await this.predict<FacialRecognitionResponse>(urls, { imagePath }, request);
    return {
      imageHeight: response.imageHeight,
      imageWidth: response.imageWidth,
      faces: response[ModelTask.FACIAL_RECOGNITION],
    };
  }

  async encodeImage(urls: string[], imagePath: string, { modelName }: CLIPConfig) {
    const request = { [ModelTask.SEARCH]: { [ModelType.VISUAL]: { modelName } } };
    const response = await this.predict<ClipVisualResponse>(urls, { imagePath }, request);
    return response[ModelTask.SEARCH];
  }

  async encodeText(urls: string[], text: string, { language, modelName }: TextEncodingOptions) {
    const request = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName, options: { language } } } };
    const response = await this.predict<ClipTextualResponse>(urls, { text }, request);
    return response[ModelTask.SEARCH];
  }

  private async getFormData(payload: ModelPayload, config: MachineLearningRequest): Promise<FormData> {
    const formData = new FormData();
    formData.append('entries', JSON.stringify(config));

    if ('imagePath' in payload) {
      let fileBuffer: Buffer;
      if (payload.imagePath.startsWith('s3://')) {
        const env = this.configRepository.getEnv();
        const s3c = env.storage.s3;
        if (!s3c?.bucket) {
          throw new Error('S3 storage not configured');
        }
        const s3 = new S3AppStorageBackend({
          endpoint: s3c.endpoint,
          region: s3c.region || 'us-east-1',
          bucket: s3c.bucket,
          prefix: s3c.prefix,
          forcePathStyle: s3c.forcePathStyle,
          useAccelerate: s3c.useAccelerate,
          accessKeyId: s3c.accessKeyId,
          secretAccessKey: s3c.secretAccessKey,
          sse: s3c.sse as any,
          sseKmsKeyId: s3c.sseKmsKeyId,
        });
        const stream = await s3.readStream(payload.imagePath);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        fileBuffer = Buffer.concat(chunks);
      } else {
        fileBuffer = await readFile(payload.imagePath);
      }
      formData.append('image', new Blob([new Uint8Array(fileBuffer)]));
    } else if ('text' in payload) {
      formData.append('text', payload.text);
    } else {
      throw new Error('Invalid input');
    }

    return formData;
  }
}
