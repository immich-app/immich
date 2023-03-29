import { QueueName } from '@app/domain';
import { BullModuleOptions } from '@nestjs/bull';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration';
import {
  AlbumEntity,
  APIKeyEntity,
  AssetEntity,
  DeviceInfoEntity,
  SharedLinkEntity,
  SmartInfoEntity,
  SystemConfigEntity,
  UserEntity,
  UserTokenEntity,
} from './entities';

const url = process.env.DB_URL;
const urlOrParts = url
  ? { url }
  : {
      host: process.env.DB_HOSTNAME || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE_NAME || 'immich',
    };

export const databaseConfig: PostgresConnectionOptions = {
  type: 'postgres',
  entities: [__dirname + '/entities/*.entity.{js,ts}'],
  synchronize: false,
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  migrationsRun: true,
  connectTimeoutMS: 10000, // 10 seconds
  ...urlOrParts,
};

export const dataSource = new DataSource(databaseConfig);

export const databaseEntities = [
  AssetEntity,
  AlbumEntity,
  APIKeyEntity,
  DeviceInfoEntity,
  UserEntity,
  SharedLinkEntity,
  SmartInfoEntity,
  SystemConfigEntity,
  UserTokenEntity,
];

export const bullConfig: BullModuleOptions = {
  prefix: 'immich_bull',
  redis: {
    host: process.env.REDIS_HOSTNAME || 'immich_redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DBINDEX || '0'),
    password: process.env.REDIS_PASSWORD || undefined,
    path: process.env.REDIS_SOCKET || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const bullQueues: BullModuleOptions[] = Object.values(QueueName).map((name) => ({ name }));

export const typesenseConfig: ConfigurationOptions = {
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'typesense',
      port: Number(process.env.TYPESENSE_PORT) || 8108,
      protocol: process.env.TYPESENSE_PROTOCOL || 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY as string,
  numRetries: 15,
  retryIntervalSeconds: 4,
  connectionTimeoutSeconds: 10,
};
