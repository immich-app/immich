import { QueueName } from '@app/domain';
import { BullModuleOptions, BullRootModuleOptions } from '@nestjs/bull';
import { ConfigModuleOptions } from '@nestjs/config';
import Joi from 'joi';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const WHEN_DB_URL_SET = Joi.when('DB_URL', {
  is: Joi.exist(),
  then: Joi.string().optional(),
  otherwise: Joi.string().required(),
});

export const immichAppConfig: ConfigModuleOptions = {
  envFilePath: '.env',
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().required().valid('development', 'production', 'staging').default('development'),
    DB_USERNAME: WHEN_DB_URL_SET,
    DB_PASSWORD: WHEN_DB_URL_SET,
    DB_DATABASE_NAME: WHEN_DB_URL_SET,
    DB_URL: Joi.string().optional(),
    DISABLE_REVERSE_GEOCODING: Joi.boolean().optional().valid(true, false).default(false),
    REVERSE_GEOCODING_PRECISION: Joi.number().optional().valid(0, 1, 2, 3).default(3),
    LOG_LEVEL: Joi.string().optional().valid('simple', 'verbose', 'debug', 'log', 'warn', 'error').default('log'),
    MACHINE_LEARNING_PORT: Joi.number().optional(),
    MICROSERVICES_PORT: Joi.number().optional(),
    SERVER_PORT: Joi.number().optional(),
  }),
};

export const bullConfig: BullRootModuleOptions = {
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

export const bullQueues: BullModuleOptions[] = [
  { name: QueueName.USER_DELETION },
  { name: QueueName.THUMBNAIL_GENERATION },
  { name: QueueName.ASSET_UPLOADED },
  { name: QueueName.METADATA_EXTRACTION },
  { name: QueueName.VIDEO_CONVERSION },
  { name: QueueName.CHECKSUM_GENERATION },
  { name: QueueName.MACHINE_LEARNING },
  { name: QueueName.CONFIG },
  { name: QueueName.BACKGROUND_TASK },
];

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
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: false,
  migrations: [__dirname + '/db/migrations/*.{js,ts}'],
  migrationsRun: true,
  connectTimeoutMS: 10000, // 10 seconds
  ...urlOrParts,
};

export const dataSource = new DataSource(databaseConfig);
