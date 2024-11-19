import { Inject, Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { CLIPConfig } from 'src/dtos/model-config.dto';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
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

@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
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

  async detectFaces(url: string[], imagePath: string, { modelName, minScore }: FaceDetectionOptions) {
    const request = {
      [ModelTask.FACIAL_RECOGNITION]: {
        [ModelType.DETECTION]: { modelName, options: { minScore } },
        [ModelType.RECOGNITION]: { modelName },
      },
    };
    const response = await this.predict<FacialRecognitionResponse>(url, { imagePath }, request);
    return {
      imageHeight: response.imageHeight,
      imageWidth: response.imageWidth,
      faces: response[ModelTask.FACIAL_RECOGNITION],
    };
  }

  async encodeImage(url: string[], imagePath: string, { modelName }: CLIPConfig) {
    const request = { [ModelTask.SEARCH]: { [ModelType.VISUAL]: { modelName } } };
    const response = await this.predict<ClipVisualResponse>(url, { imagePath }, request);
    return response[ModelTask.SEARCH];
  }

  async encodeText(url: string[], text: string, { modelName }: CLIPConfig) {
    const request = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName } } };
    const response = await this.predict<ClipTextualResponse>(url, { text }, request);
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
