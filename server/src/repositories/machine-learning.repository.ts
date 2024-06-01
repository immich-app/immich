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
  TextModelInput,
  VisionModelInput,
} from 'src/interfaces/machine-learning.interface';
import { Instrumentation } from 'src/utils/instrumentation';

const errorPrefix = 'Machine learning request';

@Instrumentation()
@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  private async predict<T>(
    url: string,
    input: TextModelInput | VisionModelInput,
    config: MachineLearningRequest,
  ): Promise<T> {
    const formData = await this.getFormData(input, config);

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
    input: VisionModelInput,
    { modelName, minScore }: FacialRecognitionOptions,
  ): Promise<FacialRecognitionResponse> {
    return this.predict<FacialRecognitionResponse>(url, input, {
      modelName,
      minScore,
      modelType: ModelType.PIPELINE,
      modelTask: ModelTask.FACIAL_RECOGNITION,
    });
  }

  encodeImage(url: string, input: VisionModelInput, { modelName }: CLIPConfig): Promise<Embedding> {
    return this.predict<Embedding>(url, input, {
      modelName,
      modelType: ModelType.VISUAL,
      modelTask: ModelTask.SEARCH,
    });
  }

  encodeText(url: string, input: TextModelInput, { modelName }: CLIPConfig): Promise<Embedding> {
    return this.predict<Embedding>(url, input, {
      modelName,
      modelType: ModelType.TEXTUAL,
      modelTask: ModelTask.SEARCH,
    });
  }

  private async getFormData(
    input: TextModelInput | VisionModelInput,
    config: MachineLearningRequest,
  ): Promise<FormData> {
    const formData = new FormData();
    const { modelName, modelTask, modelType, ...options } = config;

    formData.append('modelName', modelName);
    formData.append('modelTask', modelTask);
    formData.append('modelType', modelType);

    if (!isEmpty(options)) {
      formData.append('options', JSON.stringify(options));
    }
    if ('imagePath' in input) {
      formData.append('image', new Blob([await readFile(input.imagePath)]));
    } else if ('text' in input) {
      formData.append('text', input.text);
    } else {
      throw new Error('Invalid input');
    }

    return formData;
  }
}
