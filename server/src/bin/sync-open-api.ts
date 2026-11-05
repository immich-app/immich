#!/usr/bin/env node
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ApiModule } from 'src/app.module.js';
import { useSwagger } from 'src/utils/misc.js';

process.env.DB_URL = 'postgres://postgres:postgres@localhost:5432/immich';

const sync = async () => {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, { preview: true });
  useSwagger(app, { write: true });
  await app.close();
};

sync()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    console.log('Something went wrong');
    process.exit(1);
  });
