import { envName, getLogLevels, serverVersion } from '@app/domain';
import { WebSocketAdapter, enablePrefilter } from '@app/infra';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppService } from './app.service';
import { MicroservicesModule } from './microservices.module';

const logger = new Logger('ImmichMicroservice');
const port = Number(process.env.MICROSERVICES_PORT) || 3002;

export async function bootstrap() {
  const app = await NestFactory.create(MicroservicesModule, { logger: getLogLevels() });

  app.useWebSocketAdapter(new WebSocketAdapter(app));
  await enablePrefilter();

  await app.get(AppService).init();
  await app.listen(port);

  logger.log(`Immich Microservices is listening on ${await app.getUrl()} [v${serverVersion}] [${envName}] `);
}
