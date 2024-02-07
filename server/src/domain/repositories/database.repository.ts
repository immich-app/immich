import { Version } from '../domain.constant';

export enum DatabaseExtension {
  CUBE = 'cube',
  EARTH_DISTANCE = 'earthdistance',
  VECTOR = 'vector',
  VECTORS = 'vectors',
}

export type VectorExtension = DatabaseExtension.VECTOR | DatabaseExtension.VECTORS;

export enum VectorIndex {
  CLIP = 'clip_index',
  FACE = 'face_index',
}

export enum DatabaseLock {
  GeodataImport = 100,
  Migrations = 200,
  StorageTemplateMigration = 420,
  CLIPDimSize = 512,
}

export const extName: Record<DatabaseExtension, string> = {
  cube: 'cube',
  earthdistance: 'earthdistance',
  vector: 'pgvector',
  vectors: 'pgvecto.rs',
} as const;

export interface VectorUpdateResult {
  restartRequired: boolean;
}

export const IDatabaseRepository = 'IDatabaseRepository';

export interface IDatabaseRepository {
  getExtensionVersion(extensionName: string): Promise<Version | null>;
  getAvailableExtensionVersion(extension: DatabaseExtension): Promise<Version | null>;
  getPreferredVectorExtension(): VectorExtension;
  getPostgresVersion(): Promise<Version>;
  createExtension(extension: DatabaseExtension): Promise<void>;
  updateExtension(extension: DatabaseExtension, version?: Version): Promise<void>;
  updateVectorExtension(extension: VectorExtension, version?: Version): Promise<VectorUpdateResult>;
  reindex(index: VectorIndex): Promise<void>;
  shouldReindex(name: VectorIndex): Promise<boolean>;
  runMigrations(options?: { transaction?: 'all' | 'none' | 'each' }): Promise<void>;
  withLock<R>(lock: DatabaseLock, callback: () => Promise<R>): Promise<R>;
  isBusy(lock: DatabaseLock): boolean;
  wait(lock: DatabaseLock): Promise<void>;
}
