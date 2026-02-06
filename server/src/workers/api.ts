import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ApiModule } from 'src/app.module';
import { AppRepository } from 'src/repositories/app.repository';
import { isStartUpError } from 'src/utils/misc';

async function bootstrap() {
  process.title = 'immich-api';

  const app = await NestFactory.create<NestExpressApplication>(ApiModule, { bufferLogs: true });
  app.get(AppRepository).setCloseFn(() => app.close());

  await app.listen(3001);
}

bootstrap().catch((error) => {
  if (!isStartUpError(error)) {
    console.error(error);
  }
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
