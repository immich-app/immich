import { envName, serverVersion } from '@app/domain';
import { WebSocketAdapter, enablePrefilter } from '@app/infra';
import { ImmichLogger } from '@app/infra/logger';
import { NestFactory } from '@nestjs/core';
import { MicroservicesModule } from './microservices.module';

const logger = new ImmichLogger('ImmichMicroservice');
const port = Number(process.env.MICROSERVICES_PORT) || 3002;

export async function bootstrap() {
  const app = await NestFactory.create(MicroservicesModule, { bufferLogs: true });

  app.useLogger(app.get(ImmichLogger));
  app.useWebSocketAdapter(new WebSocketAdapter(app));
  await enablePrefilter();

  await app.listen(port);

  logger.log(`Immich Microservices is listening on ${await app.getUrl()} [v${serverVersion}] [${envName}] `);
}
