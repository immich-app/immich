export enum ServiceName {
  ImmichServer = 'immich-server',
  ImmichMachineLearning = 'immich-machine-learning',
  Postgres = 'immich-postgres',
  Redis = 'immich-redis',
}

export enum ContainerName {
  ImmichServer = 'immich-server',
  ImmichMachineLearning = 'immich-machine-learning',
  Postgres = 'immich-postgres',
  Redis = 'immich-redis',
}

export type BaseOptions = {
  releaseVersion: string;
  healthchecks?: boolean;
  machineLearning: boolean;
  containerNames?: boolean;
  serverTimeZone?: string;
};

export type GeneratorOptions = (BaseOptions & FolderOptions & PostgresOptions) & RedisOptions;

export type FolderOptions = {
  baseLocation: string;
  encodedVideoLocation?: string;
  libraryLocation?: string;
  uploadLocation?: string;
  profileLocation?: string;
  thumbnailsLocation?: string;
  backupsLocation?: string;
};

export type PostgresOptions = InternalPostgresOptions | ExternalPostgresOptions;
export type InternalPostgresOptions = {
  postgresUser: string;
  postgresPassword: string;
  postgresDatabase: string;
  postgresDataLocation: string;
};
export type ExternalPostgresOptions = { postgresUrl: string; postgresVectorExtension?: VectorExtension };

export type RedisOptions = ExternalRedisOptions | IoRedisOptions | { redis: true };
export type ExternalRedisOptions = {
  redisHost: string;
  redisPort: number;
  redisDbIndex?: number;
  redisUsername?: string;
  redisPassword?: string;
  redisSocket?: string;
};
export type IoRedisOptions = { redisUrl: string };

export type VectorExtension = 'pgvector' | 'pgvecto.rs';

export type HardwareAccelerationPlatform = 'nvenc' | 'quicksync' | 'rkmpp' | 'vappi' | 'vaapi-wsl';
