import { NestFactory } from '@nestjs/core';
import { MicroservicesModule } from 'src/apps/microservices.module';
import { envName, serverVersion } from 'src/domain/domain.constant';
import { otelSDK } from 'src/infra/instrumentation';
import { ImmichLogger } from 'src/infra/logger';
import { WebSocketAdapter } from 'src/infra/websocket.adapter';

const logger = new ImmichLogger('ImmichMicroservice');
const port = Number(process.env.MICROSERVICES_PORT) || 3002;

export async function bootstrapMicroservices() {
  otelSDK.start();
  const app = await NestFactory.create(MicroservicesModule, { bufferLogs: true });
  app.useLogger(app.get(ImmichLogger));
  app.useWebSocketAdapter(new WebSocketAdapter(app));

  await app.listen(port);

  logger.log(`Immich Microservices is listening on ${await app.getUrl()} [v${serverVersion}] [${envName}] `);
}
