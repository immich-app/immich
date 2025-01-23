import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { CLIPConfig } from 'src/dtos/model-config.dto';
import {
  ClipTextualResponse,
  ClipVisualResponse,
  FaceDetectionOptions,
  FacialRecognitionResponse,
  IMachineLearningRepository,
  MachineLearningRequest,
  ModelPayload,
  ModelTask,
  ModelType,
} from 'src/interfaces/machine-learning.interface';
import { LoggingRepository } from 'src/repositories/logging.repository';

@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MachineLearningRepository.name);
  }

  private async predict<T>(urls: string[], payload: ModelPayload, config: MachineLearningRequest): Promise<T> {
    const formData = await this.getFormData(payload, config);
    for (const url of urls) {
      try {
        const response = await fetch(new URL('/predict', url), { method: 'POST', body: formData });
        if (response.ok) {
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
