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
  classifyImage(input: MachineLearningInput): Promise<string[]>;
  encodeImage(input: MachineLearningInput): Promise<number[]>;
  encodeText(input: string): Promise<number[]>;
  detectFaces(input: MachineLearningInput): Promise<DetectFaceResult[]>;
}
