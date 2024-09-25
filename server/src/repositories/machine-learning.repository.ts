import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { CLIPConfig } from 'src/dtos/model-config.dto';
import {
  ClipTextualResponse,
  ClipVisualResponse,
  FaceDetectionOptions,
  FacialRecognitionResponse,
  IMachineLearningRepository,
  LoadTextModelActions,
  MachineLearningRequest,
  ModelPayload,
  ModelTask,
  ModelType,
} from 'src/interfaces/machine-learning.interface';
import { Instrumentation } from 'src/utils/instrumentation';

const errorPrefix = 'Machine learning request';

@Instrumentation()
@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  private async predict<T>(url: string, payload: ModelPayload, config: MachineLearningRequest): Promise<T> {
    const formData = await this.getFormData(config, payload);

    const res = await this.fetchData(url, '/predict', formData);

    if (res.status >= 400) {
      throw new Error(`${errorPrefix} '${JSON.stringify(config)}' failed with status ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  private async fetchData(url: string, path: string, formData?: FormData): Promise<Response> {
    const res = await fetch(new URL(path, url), { method: 'POST', body: formData }).catch((error: Error | any) => {
      throw new Error(`${errorPrefix} to "${url}" failed with ${error?.cause || error}`);
    });

    return res;
  }

  private prepareTextModelUrl: Record<LoadTextModelActions, string> = {
    [LoadTextModelActions.LOAD]: '/load',
    [LoadTextModelActions.UNLOAD]: '/unload',
  };

  async prepareTextModel(url: string, { modelName }: CLIPConfig, actions: LoadTextModelActions) {
    try {
      const request = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName } } };
      const formData = await this.getFormData(request);
      const res = await this.fetchData(url, this.prepareTextModelUrl[actions], formData);
      if (res.status >= 400) {
        throw new Error(`${errorPrefix} Loadings textual model failed with status ${res.status}: ${res.statusText}`);
      }
    } catch (error) {}
  }

  async detectFaces(url: string, imagePath: string, { modelName, minScore }: FaceDetectionOptions) {
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

  async encodeImage(url: string, imagePath: string, { modelName }: CLIPConfig) {
    const request = { [ModelTask.SEARCH]: { [ModelType.VISUAL]: { modelName } } };
    const response = await this.predict<ClipVisualResponse>(url, { imagePath }, request);
    return response[ModelTask.SEARCH];
  }

  async encodeText(url: string, text: string, { modelName }: CLIPConfig) {
    const request = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: { modelName } } };
    const response = await this.predict<ClipTextualResponse>(url, { text }, request);
    return response[ModelTask.SEARCH];
  }

  private async getFormData(config: MachineLearningRequest, payload?: ModelPayload): Promise<FormData> {
    const formData = new FormData();
    formData.append('entries', JSON.stringify(config));
    if (payload) {
      if ('imagePath' in payload) {
        formData.append('image', new Blob([await readFile(payload.imagePath)]));
      } else if ('text' in payload) {
        formData.append('text', payload.text);
      } else {
        throw new Error('Invalid input');
      }
    }

    return formData;
  }
}
