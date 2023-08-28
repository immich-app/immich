import { DetectFaceResult, IMachineLearningRepository, MachineLearningInput } from '@app/domain';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { createReadStream } from 'fs';

const client = axios.create();

@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  private post<T>(input: MachineLearningInput, endpoint: string): Promise<T> {
    return client.post<T>(endpoint, createReadStream(input.imagePath)).then((res) => res.data);
  }

  classifyImage(url: string, input: MachineLearningInput): Promise<string[]> {
    return this.post<string[]>(input, `${url}/image-classifier/tag-image`);
  }

  detectFaces(url: string, input: MachineLearningInput): Promise<DetectFaceResult[]> {
    return this.post<DetectFaceResult[]>(input, `${url}/facial-recognition/detect-faces`);
  }

  encodeImage(url: string, input: MachineLearningInput): Promise<number[]> {
    return this.post<number[]>(input, `${url}/sentence-transformer/encode-image`);
  }

  encodeText(url: string, input: string): Promise<number[]> {
    return client.post<number[]>(`${url}/sentence-transformer/encode-text`, { text: input }).then((res) => res.data);
  }
}
