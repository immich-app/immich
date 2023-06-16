import { DetectFaceResult, IMachineLearningRepository, MachineLearningInput, MACHINE_LEARNING_URL } from '@app/domain';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';

const client = axios.create({ baseURL: MACHINE_LEARNING_URL });

@Injectable()
export class MachineLearningRepository implements IMachineLearningRepository {
  classifyImage(input: MachineLearningInput): Promise<string[]> {
    const formData = new FormData();
    const fileStream = createReadStream(input.imagePath);
    formData.append('image', fileStream);
    return client
      .post<string[]>('/image-classifier/tag-image', formData, {
        headers: formData.getHeaders(),
      })
      .then((res) => res.data);
  }

  detectFaces(input: MachineLearningInput): Promise<DetectFaceResult[]> {
    const formData = new FormData();
    const fileStream = createReadStream(input.imagePath);
    formData.append('image', fileStream);
    return client
      .post<DetectFaceResult[]>('/facial-recognition/detect-faces', formData, {
        headers: formData.getHeaders(),
      })
      .then((res) => res.data);
  }

  encodeImage(input: MachineLearningInput): Promise<number[]> {
    const formData = new FormData();
    const fileStream = createReadStream(input.imagePath);
    formData.append('image', fileStream);
    return client
      .post<number[]>('/sentence-transformer/encode-image', formData, {
        headers: formData.getHeaders(),
      })
      .then((res) => res.data);
  }

  encodeText(input: string): Promise<number[]> {
    return client.post<number[]>('/sentence-transformer/encode-text', { text: input }).then((res) => res.data);
  }
}
