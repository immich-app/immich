import { BinaryField, Tags } from 'exiftool-vendored';

export const IMetadataRepository = 'IMetadataRepository';

export interface ExifDuration {
  Value: number;
  Scale?: number;
}

export interface ImmichTags extends Omit<Tags, 'FocalLength' | 'Duration' | 'Description' | 'ImageDescription'> {
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

  // Type is wrong, can also be number.
  Description?: string | number;
  ImageDescription?: string | number;
}

export interface IMetadataRepository {
  teardown(): Promise<void>;
  readTags(path: string): Promise<ImmichTags | null>;
  writeTags(path: string, tags: Partial<Tags>): Promise<void>;
  extractBinaryTag(tagName: string, path: string): Promise<Buffer>;
  getCountries(userId: string): Promise<Array<string | null>>;
  getStates(userId: string, country?: string): Promise<Array<string | null>>;
  getCities(userId: string, country?: string, state?: string): Promise<Array<string | null>>;
  getCameraMakes(userId: string, model?: string): Promise<Array<string | null>>;
  getCameraModels(userId: string, make?: string): Promise<Array<string | null>>;
}
