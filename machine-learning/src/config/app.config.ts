import { ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';

export const immichAppConfig: ConfigModuleOptions = {
  envFilePath: '.env',
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().required().valid('development', 'production', 'staging').default('development'),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE_NAME: Joi.string().required(),
    REDIS_HOSTNAME: Joi.string().optional(),
    REDIS_PORT: Joi.string().optional(),
    REDIS_DBINDEX: Joi.string().optional(),
    REDIS_PASSWORD: Joi.string().optional(),
    REDIS_SOCKET: Joi.string().optional(),
  }),
};
