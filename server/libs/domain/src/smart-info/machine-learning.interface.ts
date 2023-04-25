export const IMachineLearningRepository = 'IMachineLearningRepository';

export interface MachineLearningInput {
  thumbnailPath: string;
}

export interface RecognizeFacesResult {
  boundingBox: BoundingBox;
  score: number;
  embedding: number[];
}

interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface IMachineLearningRepository {
  classifyImage(input: MachineLearningInput): Promise<string[]>;
  detectObjects(input: MachineLearningInput): Promise<string[]>;
  encodeImage(input: MachineLearningInput): Promise<number[]>;
  encodeText(input: string): Promise<number[]>;
  recognizeFaces(input: MachineLearningInput): Promise<RecognizeFacesResult[]>;
}
