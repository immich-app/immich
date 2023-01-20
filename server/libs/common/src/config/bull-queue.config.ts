import { SharedBullAsyncConfiguration } from '@nestjs/bull';

export const immichBullAsyncConfig: SharedBullAsyncConfiguration = {
  useFactory: async () => ({
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
  }),
};
