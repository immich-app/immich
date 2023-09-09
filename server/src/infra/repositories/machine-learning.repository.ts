import {
  ClassificationConfig,
  CLIPConfig,
  CLIPMode,
  DetectFaceResult,
  IMachineLearningRepository,
  ModelConfig,
  ModelType,
  RecognitionConfig,
  TextModelInput,
  VisionModelInput,
} from '@app/domain';
import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';

@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  private async post<T>(url: string, input: TextModelInput | VisionModelInput, config: ModelConfig): Promise<T> {
    const formData = await this.getFormData(input, config);
    const res = await fetch(`${url}/predict`, { method: 'POST', body: formData });
    if (res.status >= 400) {
      throw new Error(
        `Request ${config.modelType ? `for ${config.modelType.replace('-', ' ')} ` : ''}` +
          `failed with status ${res.status}: ${res.statusText}`,
      );
    }
    return res.json();
  }

  classifyImage(url: string, input: VisionModelInput, config: ClassificationConfig): Promise<string[]> {
    return this.post<string[]>(url, input, { ...config, modelType: ModelType.IMAGE_CLASSIFICATION });
  }

  detectFaces(url: string, input: VisionModelInput, config: RecognitionConfig): Promise<DetectFaceResult[]> {
    return this.post<DetectFaceResult[]>(url, input, { ...config, modelType: ModelType.FACIAL_RECOGNITION });
  }

  encodeImage(url: string, input: VisionModelInput, config: CLIPConfig): Promise<number[]> {
    return this.post<number[]>(url, input, {
      ...config,
      modelType: ModelType.CLIP,
      mode: CLIPMode.VISION,
    } as CLIPConfig);
  }

  encodeText(url: string, input: TextModelInput, config: CLIPConfig): Promise<number[]> {
    return this.post<number[]>(url, input, { ...config, modelType: ModelType.CLIP, mode: CLIPMode.TEXT } as CLIPConfig);
  }

  async getFormData(input: TextModelInput | VisionModelInput, config: ModelConfig): Promise<FormData> {
    const formData = new FormData();
    const { enabled, modelName, modelType, ...options } = config;
    if (!enabled) {
      throw new Error(`${modelType} is not enabled`);
    }

    formData.append('modelName', modelName);
    if (modelType) {
      formData.append('modelType', modelType);
    }
    if (options) {
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
