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

const WHEN_OAUTH_ENABLED = Joi.when('OAUTH_ENABLED', {
  is: true,
  then: Joi.string().required(),
  otherwise: Joi.string().optional(),
});

export const immichAppConfig: ConfigModuleOptions = {
  envFilePath: '.env',
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().required().valid('development', 'production', 'staging').default('development'),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE_NAME: Joi.string().required(),
    JWT_SECRET: Joi.string().required().custom(jwtSecretValidator),
    DISABLE_REVERSE_GEOCODING: Joi.boolean().optional().valid(true, false).default(false),
    REVERSE_GEOCODING_PRECISION: Joi.number().optional().valid(0, 1, 2, 3).default(3),
    LOG_LEVEL: Joi.string().optional().valid('simple', 'verbose').default('simple'),
    OAUTH_ENABLED: Joi.bool().valid(true, false).default(false),
    OAUTH_BUTTON_TEXT: Joi.string().optional().default('Login with OAuth'),
    OAUTH_AUTO_REGISTER: Joi.bool().valid(true, false).default(true),
    OAUTH_ISSUER_URL: WHEN_OAUTH_ENABLED,
    OAUTH_SCOPE: Joi.string().optional().default('openid email profile'),
    OAUTH_CLIENT_ID: WHEN_OAUTH_ENABLED,
    OAUTH_CLIENT_SECRET: WHEN_OAUTH_ENABLED,
  }),
};
