import { DetectFaceResult, IMachineLearningRepository, MachineLearningInput, MACHINE_LEARNING_URL } from '@app/domain';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { createReadStream } from 'fs';

const client = axios.create({ baseURL: MACHINE_LEARNING_URL });

@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  private post<T>(input: MachineLearningInput, endpoint: string): Promise<T> {
    return client.post<T>(endpoint, createReadStream(input.imagePath)).then((res) => res.data);
  }

  classifyImage(input: MachineLearningInput): Promise<string[]> {
    return this.post<string[]>(input, '/image-classifier/tag-image');
  }

  detectFaces(input: MachineLearningInput): Promise<DetectFaceResult[]> {
    return this.post<DetectFaceResult[]>(input, '/facial-recognition/detect-faces');
  }

  encodeImage(input: MachineLearningInput): Promise<number[]> {
    return this.post<number[]>(input, '/sentence-transformer/encode-image');
  }

  encodeText(input: string): Promise<number[]> {
    return client.post<number[]>('/sentence-transformer/encode-text', { text: input }).then((res) => res.data);
  }
}
