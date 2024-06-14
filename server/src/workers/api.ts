import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { ApiModule } from 'src/app.module';
import { WEB_ROOT, envName, excludePaths, isDev, serverVersion } from 'src/constants';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { otelStart } from 'src/utils/instrumentation';
import { useSwagger } from 'src/utils/misc';

const host = process.env.HOST;

async function bootstrap() {
  process.title = 'immich-api';
  const otelPort = Number.parseInt(process.env.IMMICH_API_METRICS_PORT ?? '8081');

  otelStart(otelPort);

  const port = Number(process.env.IMMICH_PORT) || 3001;
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, { bufferLogs: true });
  const logger = await app.resolve<ILoggerRepository>(ILoggerRepository);

  logger.setAppName('Api');
  logger.setContext('Bootstrap');
  app.useLogger(logger);
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
  app.set('etag', 'strong');
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  if (isDev()) {
    app.enableCors();
  }
  app.useWebSocketAdapter(new WebSocketAdapter(app));
  useSwagger(app);

  app.setGlobalPrefix('api', { exclude: excludePaths });
  if (existsSync(WEB_ROOT)) {
    const { handler } = await import(`${WEB_ROOT}/handler.js`);
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api') || excludePaths.includes(req.path)) {
        next();
      } else {
        handler(req, res, next);
      }
    });
  }

  const server = await (host ? app.listen(port, host) : app.listen(port));
  server.requestTimeout = 30 * 60 * 1000;

  logger.log(`Immich Server is listening on ${await app.getUrl()} [v${serverVersion}] [${envName}] `);
}

bootstrap().catch((error) => {
  console.error(error);
  throw error;
});
