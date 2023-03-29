import { BullModuleOptions } from '@nestjs/bull';
import { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration';
import { QueueName } from '../../domain/src';

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
