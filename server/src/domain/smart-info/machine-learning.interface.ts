export const IMachineLearningRepository = 'IMachineLearningRepository';

export interface MachineLearningInput {
  imagePath: string;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectFaceResult {
  imageWidth: number;
  imageHeight: number;
  boundingBox: BoundingBox;
  score: number;
  embedding: number[];
}

export interface IMachineLearningRepository {
  classifyImage(url: string, input: MachineLearningInput): Promise<string[]>;
  encodeImage(url: string, input: MachineLearningInput): Promise<number[]>;
  encodeText(url: string, input: string): Promise<number[]>;
  detectFaces(url: string, input: MachineLearningInput): Promise<DetectFaceResult[]>;
}
