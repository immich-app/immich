export const IMachineLearningRepository = 'IMachineLearningRepository';

export interface MachineLearningInput {
  thumbnailPath: string;
}

export interface DetectFaceResult {
  boundingBox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  score: number;
  embedding: number[];
}

export interface IMachineLearningRepository {
  classifyImage(input: MachineLearningInput): Promise<string[]>;
  detectObjects(input: MachineLearningInput): Promise<string[]>;
  encodeImage(input: MachineLearningInput): Promise<number[]>;
  encodeText(input: string): Promise<number[]>;
  detectFaces(input: MachineLearningInput): Promise<DetectFaceResult[]>;
}
