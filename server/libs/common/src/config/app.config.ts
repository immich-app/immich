import { Logger } from '@nestjs/common';
import { ConfigModuleOptions } from '@nestjs/config';
import Joi from 'joi';
import { createSecretKey, generateKeySync } from 'node:crypto';

const jwtSecretValidator: Joi.CustomValidator<string> = (value) => {
  const key = createSecretKey(value, 'base64');
  const keySizeBits = (key.symmetricKeySize ?? 0) * 8;

  if (keySizeBits < 128) {
    const newKey = generateKeySync('hmac', { length: 256 }).export().toString('base64');
    Logger.warn('The current JWT_SECRET key is insecure. It should be at least 128 bits long!');
    Logger.warn(`Here is a new, securely generated key that you can use instead: ${newKey}`);
  }

  return value;
};

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
    JWT_SECRET: Joi.string().required().custom(jwtSecretValidator),
    DISABLE_REVERSE_GEOCODING: Joi.boolean().optional().valid(true, false).default(false),
    REVERSE_GEOCODING_PRECISION: Joi.number().optional().valid(0, 1, 2, 3).default(3),
    LOG_LEVEL: Joi.string().optional().valid('simple', 'verbose', 'debug', 'log', 'warn', 'error').default('log'),
    MACHINE_LEARNING_PORT: Joi.number().optional(),
    MICROSERVICES_PORT: Joi.number().optional(),
    SERVER_PORT: Joi.number().optional(),
  }),
};
