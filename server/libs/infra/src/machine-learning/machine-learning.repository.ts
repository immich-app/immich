import { MACHINE_LEARNING_URL } from '@app/common';
import { IMachineLearningRepository, MachineLearningInput } from '@app/domain';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

const client = axios.create({ baseURL: MACHINE_LEARNING_URL });

@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  tagImage(input: MachineLearningInput): Promise<string[]> {
    return client.post<string[]>('/image-classifier/tag-image', input).then((res) => res.data);
  }

  detectObjects(input: MachineLearningInput): Promise<string[]> {
    return client.post<string[]>('/object-detection/detect-object', input).then((res) => res.data);
  }

  encodeCLIPModel(input: MachineLearningInput): Promise<number[]> {
    return client.post<string>('/sentence-transformer/encode-image', input).then((res) => res.data) as any;
  }
}
