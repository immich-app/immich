import {
  ExternalPostgresOptions,
  ExternalRedisOptions,
  GeneratorOptions,
  IoRedisOptions,
  PostgresOptions,
  RedisOptions,
  ServiceName,
} from 'lib/types';

export const isExternalPostgres = (options: PostgresOptions): options is ExternalPostgresOptions =>
  'postgresUrl' in options;

export const isIoRedis = (options: RedisOptions): options is IoRedisOptions => 'redisUrl' in options;
export const isExternalRedis = (options: RedisOptions): options is ExternalRedisOptions => 'redisHost' in options;

export const asQueryParams = (values: Record<string, string | number | boolean | undefined>) => {
  return new URLSearchParams(
    Object.entries(values)
      .filter(Boolean)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
};

export const getImmichVolumes = (options: GeneratorOptions) => {
  const {
    baseLocation,
    encodedVideoLocation,
    uploadLocation,
    backupsLocation,
    profileLocation,
    libraryLocation,
    thumbnailsLocation,
  } = options;

  const internalBaseLocation = '/usr/src/app/upload';

  const volumes = [`${baseLocation}:${internalBaseLocation}`];

  for (const { override, folder } of [
    { override: encodedVideoLocation, folder: 'encoded-video' },
    { override: libraryLocation, folder: 'library' },
    { override: uploadLocation, folder: 'upload' },
    { override: profileLocation, folder: 'profile' },
    { override: thumbnailsLocation, folder: 'thumbs' },
    { override: backupsLocation, folder: 'backups' },
  ]) {
    if (override) {
      volumes.push(`${override}:${internalBaseLocation}/${folder}`);
    }
  }

  volumes.push(`/etc/localtime:/etc/localtime:ro`);

  return volumes;
};

export const getImmichEnvironment = (options: GeneratorOptions) => {
  const env: Record<string, string | number | undefined> = {};
  if (isExternalPostgres(options)) {
    env.DB_URL = options.postgresUrl;
    env.DB_VECTOR_EXTENSION = options.postgresVectorExtension;
  } else {
    const { postgresUser, postgresPassword, postgresDatabase } = options;
    env.DB_URL = `postgres://${postgresUser}:${postgresPassword}@${ServiceName.Postgres}:5432/${postgresDatabase}`;
  }

  if (isIoRedis(options)) {
    env.REDIS_URL = options.redisUrl;
  } else if (isExternalRedis(options)) {
    env.REDIS_HOSTNAME = options.redisHost;
    env.REDIS_PORT = options.redisPort;
    env.REDIS_DBINDEX = options.redisDbIndex;
    env.REDIS_USERNAME = options.redisUsername;
    env.REDIS_PASSWORD = options.redisPassword;
    env.REDIS_SOCKET = options.redisSocket;
  } else {
    env.REDIS_HOSTNAME = ServiceName.Redis;
  }

  env.TZ = options.serverTimeZone;

  return env;
};
