export enum DatabaseExtension {
  CUBE = 'cube',
  EARTH_DISTANCE = 'earthdistance',
  VECTORS = 'vectors',
}

export const IDatabaseRepository = 'IDatabaseRepository';

export interface IDatabaseRepository {
  enablePrefilter(): Promise<void>;
  getExtensionVersion(extName: string): Promise<string | null>;
  getPostgresVersion(): Promise<string>;
  createExtension(extension: DatabaseExtension): Promise<void>;
  runMigrations(options?: { transaction?: 'all' | 'none' | 'each' }): Promise<void>;
}
