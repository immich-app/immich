import { IMachineLearningRepository, MachineLearningInput, MACHINE_LEARNING_URL } from '@app/domain';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

const client = axios.create({ baseURL: MACHINE_LEARNING_URL });

@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  classifyImage(input: MachineLearningInput): Promise<string[]> {
    return client.post<string[]>('/image-classifier/tag-image', input).then((res) => res.data);
  }

  detectObjects(input: MachineLearningInput): Promise<string[]> {
    return client.post<string[]>('/object-detection/detect-object', input).then((res) => res.data);
  }

  encodeImage(input: MachineLearningInput): Promise<number[]> {
    return client.post<number[]>('/sentence-transformer/encode-image', input).then((res) => res.data);
  }

  encodeText(input: string): Promise<number[]> {
    return client.post<number[]>('/sentence-transformer/encode-text', { text: input }).then((res) => res.data);
  }

  recognizeFaces(input: MachineLearningInput): Promise<string[]> {
    console.log('regognize face');
    return client.post<string[]>('/facial-recognition/recognize-persons', input).then((res) => {
      console.log('res.data', res.data);
      return res.data;
    });
  }
}
