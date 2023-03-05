export const IMachineLearningRepository = 'IMachineLearningRepository';

export interface MachineLearningInput {
  thumbnailPath: string;
}

export interface IMachineLearningRepository {
  tagImage(input: MachineLearningInput): Promise<string[]>;
  detectObjects(input: MachineLearningInput): Promise<string[]>;
  encodeImage(input: MachineLearningInput): Promise<number[]>;
  encodeText(input: string): Promise<number[]>;
}
