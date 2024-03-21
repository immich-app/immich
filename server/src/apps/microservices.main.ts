import { NestFactory } from '@nestjs/core';
import { MicroservicesModule } from 'src/apps/microservices.module';
import { envName, serverVersion } from 'src/constants';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { otelSDK } from 'src/utils/instrumentation';
import { ImmichLogger } from 'src/utils/logger';

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
