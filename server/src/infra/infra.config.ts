import { QueueName } from '@app/domain';
import { RegisterQueueOptions } from '@nestjs/bullmq';
import { QueueOptions } from 'bullmq';
import { RedisOptions } from 'ioredis';
import { InitOptions } from 'local-reverse-geocoder';
import { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration';

function parseRedisConfig(): RedisOptions {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl && redisUrl.startsWith('ioredis://')) {
    try {
      const decodedString = Buffer.from(redisUrl.slice(10), 'base64').toString();
      return JSON.parse(decodedString);
    } catch (error) {
      throw new Error(`Failed to decode redis options: ${error}`);
    }
  }
  return {
    host: process.env.REDIS_HOSTNAME || 'immich_redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DBINDEX || '0'),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    path: process.env.REDIS_SOCKET || undefined,
  };
}

export const redisConfig: RedisOptions = parseRedisConfig();

export const bullConfig: QueueOptions = {
  prefix: 'immich_bull',
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const bullQueues: RegisterQueueOptions[] = Object.values(QueueName).map((name) => ({ name }));

function parseTypeSenseConfig(): ConfigurationOptions {
  const typesenseURL = process.env.TYPESENSE_URL;
  const common = {
    apiKey: process.env.TYPESENSE_API_KEY as string,
    numRetries: 15,
    retryIntervalSeconds: 4,
    connectionTimeoutSeconds: 10,
  };
  if (typesenseURL && typesenseURL.startsWith('ha://')) {
    try {
      const decodedString = Buffer.from(typesenseURL.slice(5), 'base64').toString();
      return {
        nodes: JSON.parse(decodedString),
        ...common,
      };
    } catch (error) {
      throw new Error(`Failed to decode typesense options: ${error}`);
    }
  }
  return {
    nodes: [
      {
        host: process.env.TYPESENSE_HOST || 'typesense',
        port: Number(process.env.TYPESENSE_PORT) || 8108,
        protocol: process.env.TYPESENSE_PROTOCOL || 'http',
      },
    ],
    ...common,
  };
}

export const typesenseConfig: ConfigurationOptions = parseTypeSenseConfig();

function parseLocalGeocodingConfig(): InitOptions {
  const precision = Number(process.env.REVERSE_GEOCODING_PRECISION);

  return {
    citiesFileOverride: precision ? ['cities15000', 'cities5000', 'cities1000', 'cities500'][precision] : undefined,
    load: {
      admin1: true,
      admin2: true,
      admin3And4: false,
      alternateNames: false,
    },
    countries: [],
    dumpDirectory: process.env.REVERSE_GEOCODING_DUMP_DIRECTORY || process.cwd() + '/.reverse-geocoding-dump/',
  };
}

export const localGeocodingConfig: InitOptions = parseLocalGeocodingConfig();
