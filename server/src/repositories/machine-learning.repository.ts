import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { CLIPConfig } from 'src/dtos/model-config.dto';
import { LoggingRepository } from 'src/repositories/logging.repository';

const PING_TIMEOUT = 2_000;
const AVAILABILITY_CACHE_TIME = 30_000;

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

@Injectable()
export class MachineLearningRepository {
  // Note that deleted URL's are not removed from this map (ie: they're leaked)
  // Cleaning them up is low priority since there should be very few over a
  // typical server uptime cycle
  private urlAvailability: {
    [url: string]: {
      active: boolean;
      lastChecked: number;
    } | undefined;
  };

  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MachineLearningRepository.name);
    this.urlAvailability = {};
  }

  private setUrlAvailability(url: string, active: boolean) {
    this.urlAvailability[url] = {
      active,
      lastChecked: new Date().getTime(),
    }
  }

  private async checkAvailability(url: string) {
    let active = false;
    try {
      const response = await fetch(new URL('/ping', url), { signal: AbortSignal.timeout(PING_TIMEOUT) });
      active = response.ok;
    } catch { }
    this.setUrlAvailability(url, active);
    return active;
  }

  private async predict<T>(urls: string[], payload: ModelPayload, config: MachineLearningRequest): Promise<T> {
    const formData = await this.getFormData(payload, config);
    let iterations = urls.length;
    for (const url of urls) {
      // Skip availability logic for the last (or only) URL
      if (--iterations > 0) {
        const availability = this.urlAvailability[url];
        if (availability === undefined) {
          // If this is a new endpoint, then check inline and skip if it fails
          if (!await this.checkAvailability(url)) {
            continue;
          }
        } else if (availability.active === false && (new Date().getTime()) - availability.lastChecked < AVAILABILITY_CACHE_TIME) {
          // If this is an old inactive endpoint that hasn't been checked in a
          // while then check but don't wait for the result, just skip it
          // This avoids delays on every search whilst allowing higher priority
          // ML servers to recover over time.
          this.checkAvailability(url).catch();
          continue;
        }
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

  async encodeText(urls: string[], text: string, { modelName }: CLIPConfig) {
    const request = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName } } };
    const response = await this.predict<ClipTextualResponse>(urls, { text }, request);
    return response[ModelTask.SEARCH];
  }

  private async getFormData(payload: ModelPayload, config: MachineLearningRequest): Promise<FormData> {
    const formData = new FormData();
    formData.append('entries', JSON.stringify(config));

    if ('imagePath' in payload) {
      formData.append('image', new Blob([await readFile(payload.imagePath)]));
    } else if ('text' in payload) {
      formData.append('text', payload.text);
    } else {
      throw new Error('Invalid input');
    }

    return formData;
  }
}
