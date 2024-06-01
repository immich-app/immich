import { Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { readFile } from 'node:fs/promises';
import { CLIPConfig } from 'src/dtos/model-config.dto';
import {
  Embedding,
  FacialRecognitionOptions,
  FacialRecognitionResponse,
  IMachineLearningRepository,
  MachineLearningRequest,
  ModelTask,
  ModelType,
} from 'src/interfaces/machine-learning.interface';
import { Instrumentation } from 'src/utils/instrumentation';

const errorPrefix = 'Machine learning request';

@Instrumentation()
@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  private async predict<T>(url: string, config: MachineLearningRequest): Promise<T> {
    const formData = await this.getFormData(config);

    const res = await fetch(new URL('/predict', url), { method: 'POST', body: formData }).catch(
      (error: Error | any) => {
        throw new Error(`${errorPrefix} to "${url}" failed with ${error?.cause || error}`);
      },
    );

    if (res.status >= 400) {
      const modelType = config.modelType ? ` for ${config.modelType.replace('-', ' ')}` : '';
      throw new Error(`${errorPrefix}${modelType} failed with status ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  detectFaces(
    url: string,
    imagePath: string,
    { modelName, minScore }: FacialRecognitionOptions,
  ): Promise<FacialRecognitionResponse> {
    return this.predict<FacialRecognitionResponse>(url, {
      imagePath,
      modelName,
      minScore,
      modelType: ModelType.PIPELINE,
      modelTask: ModelTask.FACIAL_RECOGNITION,
    });
  }

  encodeImage(url: string, imagePath: string, { modelName }: CLIPConfig): Promise<Embedding> {
    return this.predict<Embedding>(url, {
      imagePath,
      modelName,
      modelType: ModelType.VISUAL,
      modelTask: ModelTask.SEARCH,
    });
  }

  encodeText(url: string, text: string, { modelName }: CLIPConfig): Promise<Embedding> {
    return this.predict<Embedding>(url, {
      modelName,
      modelType: ModelType.TEXTUAL,
      modelTask: ModelTask.SEARCH,
      text,
    });
  }

  private async getFormData(config: MachineLearningRequest): Promise<FormData> {
    const formData = new FormData();
    const { modelName, modelTask, modelType, ...options } = config;

    formData.append('modelName', modelName);
    formData.append('modelTask', modelTask);
    formData.append('modelType', modelType);

    if (!isEmpty(options)) {
      formData.append('options', JSON.stringify(options));
    }
    if ('imagePath' in config) {
      formData.append('image', new Blob([await readFile(config.imagePath)]));
    } else if ('text' in config) {
      formData.append('text', config.text);
    } else {
      throw new Error('Invalid input');
    }

    return formData;
  }
}
