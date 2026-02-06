import { SystemConfig } from 'src/config';
import { VECTOR_EXTENSIONS } from 'src/constants';
import { DatabaseExtension, JobName, QueueName, SystemMetadataKey } from 'src/enum';

export type DeepPartial<T> =
  T extends Record<string, unknown>
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T extends Array<infer R>
      ? DeepPartial<R>[]
      : T;

export type RepositoryInterface<T extends object> = Pick<T, keyof T>;

export type SystemFlags = {
  mountFiles?: boolean;
};

export type SystemMetadata = Record<SystemMetadataKey, Record<string, unknown>> & {
  [SystemMetadataKey.AdminOnboarding]: { isOnboarded: boolean };
  [SystemMetadataKey.SystemConfig]: SystemConfig;
  [SystemMetadataKey.SystemFlags]: SystemFlags;
};

type VersionNumber = { major: number; minor: number; patch: number };

export type VectorExtension = (typeof VECTOR_EXTENSIONS)[number];

export type DatabaseExtensionInfo = {
  availableVersion: VersionNumber | null;
  installedVersion: VersionNumber | null;
};

export type DatabaseExtensionStatus = Record<DatabaseExtension, DatabaseExtensionInfo>;

export type JobItem = { name: JobName; data?: Record<string, unknown> };
export type JobHandler = (item: JobItem) => Promise<{ status: string }>;

export type QueueOptions = {
  name: QueueName;
  concurrency: number;
};

export type DatabaseConnectionParams =
  | { connectionType: 'url'; url: string }
  | {
      connectionType: 'parts';
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
      ssl?: string;
    };
