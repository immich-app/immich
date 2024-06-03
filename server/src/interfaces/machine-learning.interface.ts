export const IMachineLearningRepository = 'IMachineLearningRepository';

export enum ModelTask {
  FACIAL_RECOGNITION = 'facial-recognition',
  SEARCH = 'clip',
}

export enum ModelType {
  DETECTION = 'detection',
  PIPELINE = 'pipeline',
  RECOGNITION = 'recognition',
  TEXTUAL = 'textual',
  VISUAL = 'visual',
}

export type ModelPayload = { imagePath: string } | { text: string };

type ModelOptions = { modelName: string };

export type FaceDetectionOptions = ModelOptions & { minScore: number };

type VisualResponse = { imageHeight: number; imageWidth: number };
export type ClipVisualRequest = { [ModelTask.SEARCH]: { [ModelType.VISUAL]: ModelOptions } };
export type ClipVisualResponse = { [ModelTask.SEARCH]: { [ModelType.VISUAL]: number[] } } & VisualResponse;

export type ClipTextualRequest = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: ModelOptions } };
export type ClipTextualResponse = { [ModelTask.SEARCH]: { [ModelType.TEXTUAL]: number[] } };

export type FacialRecognitionRequest = {
  [ModelTask.FACIAL_RECOGNITION]: {
    [ModelType.DETECTION]: FaceDetectionOptions;
    [ModelType.RECOGNITION]: ModelOptions;
  };
};

export type Faces = {
  [ModelType.DETECTION]: { scores: number[]; boxes: number[][]; landmarks: number[][] };
  [ModelType.RECOGNITION]: number[][];
};

export type FacialRecognitionResponse = { [ModelTask.FACIAL_RECOGNITION]: Faces } & VisualResponse;

export type MachineLearningRequest = ClipVisualRequest | ClipTextualRequest | FacialRecognitionRequest;

export interface IMachineLearningRepository {
  encodeImage(url: string, imagePath: string, config: ModelOptions): Promise<ClipVisualResponse>;
  encodeText(url: string, text: string, config: ModelOptions): Promise<ClipTextualResponse>;
  detectFaces(url: string, imagePath: string, config: FaceDetectionOptions): Promise<FacialRecognitionResponse>;
}
