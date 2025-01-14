export enum DatabaseExtension {
  CUBE = 'cube',
  EARTH_DISTANCE = 'earthdistance',
  VECTOR = 'vector',
  VECTORS = 'vectors',
}

export type VectorExtension = DatabaseExtension.VECTOR | DatabaseExtension.VECTORS;

export type DatabaseConnectionURL = {
  connectionType: 'url';
  url: string;
};

export type DatabaseConnectionParts = {
  connectionType: 'parts';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

export type DatabaseConnectionParams = DatabaseConnectionURL | DatabaseConnectionParts;

export enum VectorIndex {
  CLIP = 'clip_index',
  FACE = 'face_index',
}

export enum DatabaseLock {
  GeodataImport = 100,
  Migrations = 200,
  SystemFileMounts = 300,
  StorageTemplateMigration = 420,
  VersionHistory = 500,
  CLIPDimSize = 512,
  Library = 1337,
  GetSystemConfig = 69,
  BackupDatabase = 42,
}

export const EXTENSION_NAMES: Record<DatabaseExtension, string> = {
  cube: 'cube',
  earthdistance: 'earthdistance',
  vector: 'pgvector',
  vectors: 'pgvecto.rs',
} as const;

export interface ExtensionVersion {
  availableVersion: string | null;
  installedVersion: string | null;
}

export interface VectorUpdateResult {
  restartRequired: boolean;
}

export const IDatabaseRepository = 'IDatabaseRepository';

export interface IDatabaseRepository {
  init(): void;
  reconnect(): Promise<boolean>;
  shutdown(): Promise<void>;
  getExtensionVersion(extension: DatabaseExtension): Promise<ExtensionVersion>;
  getExtensionVersionRange(extension: VectorExtension): string;
  getPostgresVersion(): Promise<string>;
  getPostgresVersionRange(): string;
  createExtension(extension: DatabaseExtension): Promise<void>;
  updateVectorExtension(extension: VectorExtension, version?: string): Promise<VectorUpdateResult>;
  reindex(index: VectorIndex): Promise<void>;
  shouldReindex(name: VectorIndex): Promise<boolean>;
  runMigrations(options?: { transaction?: 'all' | 'none' | 'each' }): Promise<void>;
  withLock<R>(lock: DatabaseLock, callback: () => Promise<R>): Promise<R>;
  tryLock(lock: DatabaseLock): Promise<boolean>;
  isBusy(lock: DatabaseLock): boolean;
  wait(lock: DatabaseLock): Promise<void>;
}
