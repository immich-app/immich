import { ClassificationConfig, CLIPConfig, RecognitionConfig } from './dto';

export const IMachineLearningRepository = 'IMachineLearningRepository';

export interface VisionModelInput {
  imagePath: string;
}

export interface TextModelInput {
  text: string;
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

export enum ModelType {
  IMAGE_CLASSIFICATION = 'image-classification',
  FACIAL_RECOGNITION = 'facial-recognition',
  CLIP = 'clip',
}

export enum CLIPMode {
  VISION = 'vision',
  TEXT = 'text',
}

export interface IMachineLearningRepository {
  classifyImage(url: string, input: VisionModelInput, config: ClassificationConfig): Promise<string[]>;
  encodeImage(url: string, input: VisionModelInput, config: CLIPConfig): Promise<number[]>;
  encodeText(url: string, input: TextModelInput, config: CLIPConfig): Promise<number[]>;
  detectFaces(url: string, input: VisionModelInput, config: RecognitionConfig): Promise<DetectFaceResult[]>;
}
