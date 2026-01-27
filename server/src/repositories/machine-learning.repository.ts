import { Injectable } from '@nestjs/common';
import { context, Span, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { Duration } from 'luxon';
import { readFile } from 'node:fs/promises';
import { MachineLearningConfig } from 'src/config';
import { CLIPConfig } from 'src/dtos/model-config.dto';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { Traced } from 'src/utils/instrumentation';

const tracer = trace.getTracer('immich');

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
    const taskType = Object.keys(config)[0] as ModelTask;

    return tracer.startActiveSpan('ml.predict', { kind: SpanKind.CLIENT }, context.active(), async (span: Span) => {
      span.setAttribute('ml.task', taskType);

      const formData = await this.getFormData(payload, config);
      let attemptCount = 0;
      let successUrl: string | undefined;

      const urls = [
        ...this.config.urls.filter((url) => this.isHealthy(url)),
        ...this.config.urls.filter((url) => !this.isHealthy(url)),
      ];

      for (const url of urls) {
        attemptCount++;
        try {
          const response = await fetch(new URL('/predict', url), { method: 'POST', body: formData });
          if (response.ok) {
            this.setHealthy(url, true);
            successUrl = url;
            span.setAttribute('ml.url', url);
            span.setAttribute('ml.attempts', attemptCount);
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
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

      span.setAttribute('ml.attempts', attemptCount);
      const errorMessage = `Machine learning request '${JSON.stringify(config)}' failed for all URLs`;
      span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
      span.end();
      throw new Error(errorMessage);
    });
  }

  @Traced({ name: 'ml.detectFaces', kind: SpanKind.CLIENT })
  async detectFaces(imagePath: string, { modelName, minScore }: FaceDetectionOptions) {
    const span = trace.getActiveSpan();
    span?.setAttribute('ml.modelName', modelName);
    span?.setAttribute('ml.minScore', minScore);

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

  @Traced({ name: 'ml.encodeImage', kind: SpanKind.CLIENT })
  async encodeImage(imagePath: string, { modelName }: CLIPConfig) {
    trace.getActiveSpan()?.setAttribute('ml.modelName', modelName);

    const request = { [ModelTask.SEARCH]: { [ModelType.VISUAL]: { modelName } } };
    const response = await this.predict<ClipVisualResponse>({ imagePath }, request);
    return response[ModelTask.SEARCH];
  }

  @Traced({ name: 'ml.encodeText', kind: SpanKind.CLIENT })
  async encodeText(text: string, { language, modelName }: TextEncodingOptions) {
    const span = trace.getActiveSpan();
    span?.setAttribute('ml.modelName', modelName);
    if (language) {
      span?.setAttribute('ml.language', language);
    }

    const request = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName, options: { language } } } };
    const response = await this.predict<ClipTextualResponse>({ text }, request);
    return response[ModelTask.SEARCH];
  }

  @Traced({ name: 'ml.ocr', kind: SpanKind.CLIENT })
  async ocr(imagePath: string, { modelName, minDetectionScore, minRecognitionScore, maxResolution }: OcrOptions) {
    const span = trace.getActiveSpan();
    span?.setAttribute('ml.modelName', modelName);
    span?.setAttribute('ml.minDetectionScore', minDetectionScore);
    span?.setAttribute('ml.minRecognitionScore', minRecognitionScore);
    span?.setAttribute('ml.maxResolution', maxResolution);

    const request = {
      [ModelTask.OCR]: {
        [ModelType.DETECTION]: { modelName, options: { minScore: minDetectionScore, maxResolution } },
        [ModelType.RECOGNITION]: { modelName, options: { minScore: minRecognitionScore } },
      },
    };
    const response = await this.predict<OcrResponse>({ imagePath }, request);
    return response[ModelTask.OCR];
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
