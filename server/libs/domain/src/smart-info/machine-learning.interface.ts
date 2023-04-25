export const IMachineLearningRepository = 'IMachineLearningRepository';

export interface MachineLearningInput {
  thumbnailPath: string;
}

export interface RecognizeFacesResult {
  bbox: number[];
  det_score: number;
  normed_embedding: number[];
}

export interface IMachineLearningRepository {
  classifyImage(input: MachineLearningInput): Promise<string[]>;
  detectObjects(input: MachineLearningInput): Promise<string[]>;
  encodeImage(input: MachineLearningInput): Promise<number[]>;
  encodeText(input: string): Promise<number[]>;
  recognizeFaces(input: MachineLearningInput): Promise<RecognizeFacesResult[]>;
}
