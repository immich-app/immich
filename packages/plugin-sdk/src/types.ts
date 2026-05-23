import type {
  AssetStatus,
  AssetType,
  AssetVisibility,
  WorkflowTrigger,
  WorkflowType,
} from 'src/enum.js';

type DeepPartial<T> = T extends Date
  ? T
  : T extends Record<string, unknown>
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T extends Array<infer R>
      ? DeepPartial<R>[]
      : T;

export type WorkflowEventMap = {
  [WorkflowType.AssetV1]: AssetV1;
  [WorkflowType.AssetPersonV1]: AssetPersonV1;
};

export type WorkflowEventData<T extends WorkflowType> = WorkflowEventMap[T];

export type WorkflowEventPayload<
  T extends WorkflowType = WorkflowType,
  TConfig = WorkflowStepConfig,
> = {
  trigger: WorkflowTrigger;
  type: T;
  data: WorkflowEventData<T>;
  config: TConfig;
  workflow: {
    id: string;
    authToken: string;
    stepId: string;
    debug?: boolean;
  };
};

export type WorkflowChanges<T extends WorkflowType = WorkflowType> =
  DeepPartial<WorkflowEventData<T>>;

export type WorkflowResponse<T extends WorkflowType = WorkflowType> = {
  workflow?: {
    /** stop the workflow */
    continue?: boolean;
  };
  changes?: WorkflowChanges<T>;
  /** data to be passed to the next workflow step */
  data?: Record<string, unknown>;
};

export type WorkflowStepConfig = {
  [key: string]: ConfigValue;
};

export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | ConfigValue[]
  | { [key: string]: ConfigValue };

export type AssetV1 = {
  asset: {
    id: string;
    ownerId: string;
    type: AssetType;
    originalPath: string;
    fileCreatedAt: Date;
    fileModifiedAt: Date;
    isFavorite: boolean;
    checksum: Buffer; // sha1 checksum
    livePhotoVideoId: string | null;
    updatedAt: Date;
    createdAt: Date;
    originalFileName: string;
    isOffline: boolean;
    libraryId: string | null;
    isExternal: boolean;
    deletedAt: Date | null;
    localDateTime: Date;
    stackId: string | null;
    duplicateId: string | null;
    status: AssetStatus;
    visibility: AssetVisibility;
    isEdited: boolean;
    exifInfo: {
      make: string | null;
      model: string | null;
      exifImageWidth: number | null;
      exifImageHeight: number | null;
      fileSizeInByte: number | null;
      orientation: string | null;
      dateTimeOriginal: Date | null;
      modifyDate: Date | null;
      lensModel: string | null;
      fNumber: number | null;
      focalLength: number | null;
      iso: number | null;
      latitude: number | null;
      longitude: number | null;
      city: string | null;
      state: string | null;
      country: string | null;
      description: string | null;
      fps: number | null;
      exposureTime: string | null;
      livePhotoCID: string | null;
      timeZone: string | null;
      projectionType: string | null;
      profileDescription: string | null;
      colorspace: string | null;
      bitsPerSample: number | null;
      autoStackId: string | null;
      rating: number | null;
      tags: string[] | null;
      updatedAt: Date | null;
    } | null;
  };
};

export type AssetPersonV1 = AssetV1 & {
  person: {
    id: string;
    name: string;
  };
};
