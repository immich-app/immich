import { BinaryField, Tags } from 'exiftool-vendored';

export const IMetadataRepository = 'IMetadataRepository';

export interface ExifDuration {
  Value: number;
  Scale?: number;
}

export interface ImmichTags extends Omit<Tags, 'FocalLength' | 'Duration'> {
  ContentIdentifier?: string;
  MotionPhoto?: number;
  MotionPhotoVersion?: number;
  MotionPhotoPresentationTimestampUs?: number;
  MediaGroupUUID?: string;
  ImagePixelDepth?: string;
  FocalLength?: number;
  Duration?: number | string | ExifDuration;
  EmbeddedVideoType?: string;
  EmbeddedVideoFile?: BinaryField;
  MotionPhotoVideo?: BinaryField;
}

export interface IMetadataRepository {
  teardown(): Promise<void>;
  readTags(path: string): Promise<ImmichTags | null>;
  writeTags(path: string, tags: Partial<Tags>): Promise<void>;
  extractBinaryTag(tagName: string, path: string): Promise<Buffer>;
  getCountries(userId: string): Promise<string[]>;
  getStates(userId: string, country?: string): Promise<string[]>;
  getCities(userId: string, country?: string, state?: string): Promise<string[]>;
  getCameraMakes(userId: string, model?: string): Promise<string[]>;
  getCameraModels(userId: string, make?: string): Promise<string[]>;
}
