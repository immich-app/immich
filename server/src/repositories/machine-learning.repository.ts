import { Injectable } from '@nestjs/common';
import { Duration } from 'luxon';
import { readFile } from 'node:fs/promises';
import { MachineLearningConfig } from 'src/config';
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
  OCR = 'ocr',
}

export enum ModelType {
  DETECTION = 'detection',
  PIPELINE = 'pipeline',
  RECOGNITION = 'recognition',
  TEXTUAL = 'textual',
  VISUAL = 'visual',
  OCR = 'ocr',
}

export type ModelPayload = { imagePath: string } | { text: string };

type ModelOptions = { modelName: string };

export type FaceDetectionOptions = ModelOptions & { minScore: number };
export type OcrOptions = ModelOptions & {
  minDetectionScore: number;
  minRecognitionScore: number;
  maxResolution: number;
};
type VisualResponse = { imageHeight: number; imageWidth: number };
export type ClipVisualRequest = { [ModelTask.SEARCH]: { [ModelType.VISUAL]: ModelOptions } };
export type ClipVisualResponse = { [ModelTask.SEARCH]: string } & VisualResponse;

export type ClipTextualRequest = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: ModelOptions } };
export type ClipTextualResponse = { [ModelTask.SEARCH]: string };

export type OCR = {
  text: string[];
  box: number[];
  boxScore: number[];
  textScore: number[];
};

export type OcrRequest = {
  [ModelTask.OCR]: {
    [ModelType.DETECTION]: ModelOptions & { options: { minScore: number; maxResolution: number } };
    [ModelType.RECOGNITION]: ModelOptions & { options: { minScore: number } };
  };
};
export type OcrResponse = { [ModelTask.OCR]: OCR } & VisualResponse;

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
export type MachineLearningRequest = ClipVisualRequest | ClipTextualRequest | FacialRecognitionRequest | OcrRequest;
export type TextEncodingOptions = ModelOptions & { language?: string };

@Injectable()
export class MachineLearningRepository {
  private healthyMap: Record<string, boolean> = {};
  private interval?: ReturnType<typeof setInterval>;
  private _config?: MachineLearningConfig;

  private get config(): MachineLearningConfig {
    if (!this._config) {
      throw new Error('Machine learning repository not been setup');
    }

    return this._config;
  }
  // Cache whether a given ML server supports /phash to avoid repeated 404 spam
  private pHashSupport: { [url: string]: boolean | undefined } = {};

  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MachineLearningRepository.name);
  }

  setup(config: MachineLearningConfig) {
    this._config = config;
    this.teardown();

    // delete old servers
    for (const url of Object.keys(this.healthyMap)) {
      if (!config.urls.includes(url)) {
        delete this.healthyMap[url];
      }
    }

    if (!config.enabled || !config.availabilityChecks.enabled) {
      return;
    }

    this.tick();
    this.interval = setInterval(
      () => this.tick(),
      Duration.fromObject({ milliseconds: config.availabilityChecks.interval }).as('milliseconds'),
    );
  }

  teardown() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private tick() {
    for (const url of this.config.urls) {
      void this.check(url);
    }
  }

  private async check(url: string) {
    let healthy = false;
    try {
      const response = await fetch(new URL('/ping', url), {
        signal: AbortSignal.timeout(this.config.availabilityChecks.timeout),
      });
      if (response.ok) {
        healthy = true;
      }
    } catch {
      // nothing to do here
    }

    this.setHealthy(url, healthy);
  }

  private setHealthy(url: string, healthy: boolean) {
    if (this.healthyMap[url] !== healthy) {
      this.logger.log(`Machine learning server became ${healthy ? 'healthy' : 'unhealthy'} (${url}).`);
    }

    this.healthyMap[url] = healthy;
  }

  private isHealthy(url: string) {
    if (!this.config.availabilityChecks.enabled) {
      return true;
    }

    return this.healthyMap[url];
  }

  private async predict<T>(payload: ModelPayload, config: MachineLearningRequest): Promise<T> {
    const formData = await this.getFormData(payload, config);

    for (const url of [
      // try healthy servers first
      ...this.config.urls.filter((url) => this.isHealthy(url)),
      ...this.config.urls.filter((url) => !this.isHealthy(url)),
    ]) {
      try {
        const response = await fetch(new URL('/predict', url), { method: 'POST', body: formData });
        if (response.ok) {
          this.setHealthy(url, true);
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

      this.setHealthy(url, false);
    }

    throw new Error(`Machine learning request '${JSON.stringify(config)}' failed for all URLs`);
  }

  async detectFaces(imagePath: string, { modelName, minScore }: FaceDetectionOptions) {
    const request = {
      [ModelTask.FACIAL_RECOGNITION]: {
        [ModelType.DETECTION]: { modelName, options: { minScore } },
        [ModelType.RECOGNITION]: { modelName },
      },
    };
    const response = await this.predict<FacialRecognitionResponse>({ imagePath }, request);
    return {
      imageHeight: response.imageHeight,
      imageWidth: response.imageWidth,
      faces: response[ModelTask.FACIAL_RECOGNITION],
    };
  }

  async encodeImage(imagePath: string, { modelName }: CLIPConfig) {
    const request = { [ModelTask.SEARCH]: { [ModelType.VISUAL]: { modelName } } };
    const response = await this.predict<ClipVisualResponse>({ imagePath }, request);
    return response[ModelTask.SEARCH];
  }

  async encodeText(text: string, { language, modelName }: TextEncodingOptions) {
    const request = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName, options: { language } } } };
    const response = await this.predict<ClipTextualResponse>({ text }, request);
    return response[ModelTask.SEARCH];
  }

  async ocr(imagePath: string, { modelName, minDetectionScore, minRecognitionScore, maxResolution }: OcrOptions) {
    const request = {
      [ModelTask.OCR]: {
        [ModelType.DETECTION]: { modelName, options: { minScore: minDetectionScore, maxResolution } },
        [ModelType.RECOGNITION]: { modelName, options: { minScore: minRecognitionScore } },
      },
    };
    const response = await this.predict<OcrResponse>({ imagePath }, request);
    return response[ModelTask.OCR];
  }

  async computePhash(urls: string[], imagePath: string): Promise<string> {
    // Similar URL selection strategy as predict(); iterate urls until success
    let urlCounter = 0;
    for (const url of urls) {
      urlCounter++;
      const isLast = urlCounter >= urls.length;
      // Skip if we've previously learned this endpoint lacks pHash support
      if (this.pHashSupport[url] === false) {
        continue;
      }
      if (!isLast && (await this.shouldSkipUrl(url))) {
        continue;
      }
      try {
        const formData = new FormData();
        formData.append('image', new Blob([await readFile(imagePath)]));
        const response = await fetch(new URL('/phash', url), { method: 'POST', body: formData });
        if (response.status === 404) {
          this.pHashSupport[url] = false; // mark unsupported
          this.logger.verbose(`ML server ${url} does not support /phash (404). Disabling further attempts.`);
          continue;
        }
        if (response.ok) {
          this.setUrlAvailability(url, true);
          this.pHashSupport[url] = true;
          const data = (await response.json()) as { pHash?: string };
          if (data.pHash && /^[0-9a-fA-F]{16}$/.test(data.pHash)) {
            return data.pHash.toLowerCase();
          }
          this.logger.warn(`Machine learning /phash response malformed for ${url}`);
          break;
        }
        this.logger.warn(
          `Machine learning pHash request to "${url}" failed with status ${response.status}: ${response.statusText}`,
        );
      } catch (error: Error | unknown) {
        this.logger.warn(
          `Machine learning pHash request to "${url}" failed: ${error instanceof Error ? error.message : error}`,
        );
      }
      this.setUrlAvailability(url, false);
    }
    throw new Error('Machine learning pHash request failed for all URLs');
  }

  async autoStackScore(
    urls: string[],
    embeddings: Record<string, number[]>,
    pHashes: Record<string, string>,
  ): Promise<{ avgCos: number | null; pHashAvg: number | null; blended: number | null }> {
    let urlCounter = 0;
    for (const url of urls) {
      urlCounter++;
      const isLast = urlCounter >= urls.length;
      if (!isLast && (await this.shouldSkipUrl(url))) {
        continue;
      }
      try {
        const response = await fetch(new URL('/auto-stack/score', url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeddings, pHashes }),
        });
        if (response.status === 404) {
          // Endpoint unsupported; mark server inactive for this feature only (do not spam)
          this.logger.verbose(`ML server ${url} does not support /auto-stack/score (404)`);
          continue;
        }
        if (response.ok) {
          this.setUrlAvailability(url, true);
          const data = await response.json();
          return {
            avgCos: typeof data.avgCos === 'number' ? data.avgCos : null,
            pHashAvg: typeof data.pHashAvg === 'number' ? data.pHashAvg : null,
            blended: typeof data.blended === 'number' ? data.blended : null,
          };
        }
        this.logger.warn(
          `Machine learning auto-stack score request to "${url}" failed with status ${response.status}: ${response.statusText}`,
        );
      } catch (error: any) {
        this.logger.warn(`Machine learning auto-stack score request to "${url}" failed: ${error?.message || error}`);
      }
      this.setUrlAvailability(url, false);
    }
    throw new Error('Machine learning auto-stack score request failed for all URLs');
  }

  async autoStackScoreBatch(
    urls: string[],
    groups: { id: string; embeddings: Record<string, number[]>; pHashes: Record<string, string> }[],
  ): Promise<Record<string, { avgCos: number | null; pHashAvg: number | null; blended: number | null }>> {
    let urlCounter = 0;
    for (const url of urls) {
      urlCounter++;
      const isLast = urlCounter >= urls.length;
      if (!isLast && (await this.shouldSkipUrl(url))) {
        continue;
      }
      try {
        const response = await fetch(new URL('/auto-stack/score-batch', url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groups }),
        });
        if (response.status === 404) {
          this.logger.verbose(`ML server ${url} does not support /auto-stack/score-batch (404)`);
          continue;
        }
        if (response.ok) {
          this.setUrlAvailability(url, true);
          const data = await response.json();
          if (data && Array.isArray(data.results)) {
            const out: Record<string, { avgCos: number | null; pHashAvg: number | null; blended: number | null }> = {};
            for (const r of data.results) {
              const id = String(r.id);
              out[id] = {
                avgCos: typeof r.avgCos === 'number' ? r.avgCos : null,
                pHashAvg: typeof r.pHashAvg === 'number' ? r.pHashAvg : null,
                blended: typeof r.blended === 'number' ? r.blended : null,
              };
            }
            return out;
          }
          this.logger.warn('Machine learning auto-stack batch score malformed response');
        } else {
          this.logger.warn(
            `Machine learning auto-stack batch score request to "${url}" failed with status ${response.status}: ${response.statusText}`,
          );
        }
      } catch (error: any) {
        this.logger.warn(
          `Machine learning auto-stack batch score request to "${url}" failed: ${error?.message || error}`,
        );
      }
      this.setUrlAvailability(url, false);
    }
    throw new Error('Machine learning auto-stack batch score request failed for all URLs');
  }

  private async getFormData(payload: ModelPayload, config: MachineLearningRequest): Promise<FormData> {
    const formData = new FormData();
    formData.append('entries', JSON.stringify(config));

    if ('imagePath' in payload) {
      const fileBuffer = await readFile(payload.imagePath);
      formData.append('image', new Blob([new Uint8Array(fileBuffer)]));
    } else if ('text' in payload) {
      formData.append('text', payload.text);
    } else {
      throw new Error('Invalid input');
    }

    return formData;
  }
}
