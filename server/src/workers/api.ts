import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ApiModule } from 'src/app.module';
import { serverVersion } from 'src/constants';
import { AppRepository } from 'src/repositories/app.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { isStartUpError } from 'src/utils/misc';

async function bootstrap() {
  process.title = 'server-api';

  const app = await NestFactory.create<NestExpressApplication>(ApiModule, { bufferLogs: true });
  app.get(AppRepository).setCloseFn(() => app.close());
  const configRepository = app.get(ConfigRepository);
  const { environment } = configRepository.getEnv();
  const logger = await app.resolve(LoggingRepository);
  await app.listen(3001);
  logger.log(`Server API is running [v${serverVersion}] [${environment}] `);
}

bootstrap().catch((error) => {
  if (!isStartUpError(error)) {
    console.error(error);
  }
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
