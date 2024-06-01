export const IMachineLearningRepository = 'IMachineLearningRepository';

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type Embedding = number[];

export interface FacialRecognitionResult {
  boundingBox: BoundingBox;
  score: number;
  embedding: Embedding;
}

export interface FacialRecognitionResponse {
  faces: FacialRecognitionResult[];
  imageHeight: number;
  imageWidth: number;
}

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

interface BaseMachineLearningRequest {
  modelName: string;
  modelTask: string;
  modelType: string;
}

export interface ClipVisualOptions {
  modelName: string;
}

export interface ClipTextualOptions {
  modelName: string;
}

export interface FacialRecognitionOptions {
  modelName: string;
  minScore: number;
}

export interface ClipVisualRequest extends BaseMachineLearningRequest {
  imagePath: string;
  modelTask: ModelTask.SEARCH;
  modelType: ModelType.VISUAL;
}

export interface ClipTextualRequest extends BaseMachineLearningRequest {
  modelTask: ModelTask.SEARCH;
  modelType: ModelType.TEXTUAL;
  text: string;
}

export interface FacialRecognitionRequest extends BaseMachineLearningRequest {
  imagePath: string;
  minScore: number;
  modelTask: ModelTask.FACIAL_RECOGNITION;
  modelType: ModelType.PIPELINE;
}

export type MachineLearningRequest = ClipVisualRequest | ClipTextualRequest | FacialRecognitionRequest;

export interface IMachineLearningRepository {
  encodeImage(url: string, imagePath: string, config: ClipVisualOptions): Promise<Embedding>;
  encodeText(url: string, text: string, config: ClipTextualOptions): Promise<Embedding>;
  detectFaces(url: string, imagePath: string, config: FacialRecognitionOptions): Promise<FacialRecognitionResponse>;
}
