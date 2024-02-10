// TODO: remove nestjs references from domain
import { LogLevel } from '@app/infra/entities';
import { ConfigModuleOptions } from '@nestjs/config';
import Joi from 'joi';

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
    DB_USERNAME: WHEN_DB_URL_SET,
    DB_PASSWORD: WHEN_DB_URL_SET,
    DB_DATABASE_NAME: WHEN_DB_URL_SET,
    DB_URL: Joi.string().optional(),
    LOG_LEVEL: Joi.string()
      .optional()
      .valid(...Object.values(LogLevel)),
    MACHINE_LEARNING_PORT: Joi.number().optional(),
    MICROSERVICES_PORT: Joi.number().optional(),
    SERVER_PORT: Joi.number().optional(),
    VECTOR_EXTENSION: Joi.string().optional().valid('pgvector', 'pgvecto.rs').default('pgvecto.rs'),
  }),
};
