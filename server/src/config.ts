import { RegisterQueueOptions } from '@nestjs/bullmq';
import { ConfigModuleOptions } from '@nestjs/config';
import { QueueOptions } from 'bullmq';
import { Request, Response } from 'express';
import { RedisOptions } from 'ioredis';
import Joi from 'joi';
import { CLS_ID, ClsModuleOptions } from 'nestjs-cls';
import { LogLevel } from 'src/entities/system-config.entity';
import { QueueName } from 'src/interfaces/job.interface';

const WHEN_DB_URL_SET = Joi.when('DB_URL', {
  is: Joi.exist(),
  then: Joi.string().optional(),
  otherwise: Joi.string().required(),
});

export const immichAppConfig: ConfigModuleOptions = {
  envFilePath: '.env',
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().optional().valid('development', 'production', 'staging').default('development'),
    LOG_LEVEL: Joi.string()
      .optional()
      .valid(...Object.values(LogLevel)),

    DB_USERNAME: WHEN_DB_URL_SET,
    DB_PASSWORD: WHEN_DB_URL_SET,
    DB_DATABASE_NAME: WHEN_DB_URL_SET,
    DB_URL: Joi.string().optional(),
    DB_VECTOR_EXTENSION: Joi.string().optional().valid('pgvector', 'pgvecto.rs').default('pgvecto.rs'),
    DB_SKIP_MIGRATIONS: Joi.boolean().optional().default(false),

    MACHINE_LEARNING_PORT: Joi.number().optional(),
    MICROSERVICES_PORT: Joi.number().optional(),
    IMMICH_METRICS_PORT: Joi.number().optional(),

    IMMICH_METRICS: Joi.boolean().optional().default(false),
    IMMICH_HOST_METRICS: Joi.boolean().optional().default(false),
    IMMICH_API_METRICS: Joi.boolean().optional().default(false),
    IMMICH_IO_METRICS: Joi.boolean().optional().default(false),
  }),
};

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
    host: process.env.REDIS_HOSTNAME || 'redis',
    port: Number.parseInt(process.env.REDIS_PORT || '6379'),
    db: Number.parseInt(process.env.REDIS_DBINDEX || '0'),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    path: process.env.REDIS_SOCKET || undefined,
  };
}

export const bullConfig: QueueOptions = {
  prefix: 'immich_bull',
  connection: parseRedisConfig(),
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const bullQueues: RegisterQueueOptions[] = Object.values(QueueName).map((name) => ({ name }));

export const clsConfig: ClsModuleOptions = {
  middleware: {
    mount: true,
    generateId: true,
    setup: (cls, req: Request, res: Response) => {
      const headerValues = req.headers['x-immich-cid'];
      const headerValue = Array.isArray(headerValues) ? headerValues[0] : headerValues;
      const cid = headerValue || cls.get(CLS_ID);
      cls.set(CLS_ID, cid);
      res.header('x-immich-cid', cid);
    },
  },
};
