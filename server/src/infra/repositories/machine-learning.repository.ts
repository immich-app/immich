import { DetectFaceResult, IMachineLearningRepository, MachineLearningInput, MACHINE_LEARNING_URL } from '@app/domain';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

const client = axios.create({ baseURL: MACHINE_LEARNING_URL });

@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  classifyImage(input: MachineLearningInput): Promise<string[]> {
    return client.post<string[]>('/image-classifier/tag-image', input).then((res) => res.data);
  }

  detectFaces(input: MachineLearningInput): Promise<DetectFaceResult[]> {
    return client.post<DetectFaceResult[]>('/facial-recognition/detect-faces', input).then((res) => res.data);
  }

  encodeImage(input: MachineLearningInput): Promise<number[]> {
    return client.post<number[]>('/sentence-transformer/encode-image', input).then((res) => res.data);
  }

  encodeText(input: string): Promise<number[]> {
    return client.post<number[]>('/sentence-transformer/encode-text', { text: input }).then((res) => res.data);
  }
}
