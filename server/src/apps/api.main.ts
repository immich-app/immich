import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import sirv from 'sirv';
import { ApiModule } from 'src/apps/api.module';
import { ApiService } from 'src/apps/api.service';
import { excludePaths } from 'src/config';
import { WEB_ROOT, envName, isDev, serverVersion } from 'src/constants';
import { useSwagger } from 'src/immich/app.utils';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { otelSDK } from 'src/utils/instrumentation';
import { ImmichLogger } from 'src/utils/logger';

const logger = new ImmichLogger('ImmichServer');
const port = Number(process.env.SERVER_PORT) || 3001;

export async function bootstrapApi() {
  otelSDK.start();
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, { bufferLogs: true });

  app.useLogger(app.get(ImmichLogger));
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
  app.set('etag', 'strong');
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  if (isDev) {
    app.enableCors();
  }
  app.useWebSocketAdapter(new WebSocketAdapter(app));
  useSwagger(app, isDev);

  app.setGlobalPrefix('api', { exclude: excludePaths });
  if (existsSync(WEB_ROOT)) {
    // copied from https://github.com/sveltejs/kit/blob/679b5989fe62e3964b9a73b712d7b41831aa1f07/packages/adapter-node/src/handler.js#L46
    // provides serving of precompressed assets and caching of immutable assets
    app.use(
      sirv(WEB_ROOT, {
        etag: true,
        gzip: true,
        brotli: true,
        setHeaders: (res, pathname) => {
          if (pathname.startsWith(`/_app/immutable`) && res.statusCode === 200) {
            res.setHeader('cache-control', 'public,max-age=31536000,immutable');
          }
        },
      }),
    );
  }
  app.use(app.get(ApiService).ssr(excludePaths));

  const server = await app.listen(port);
  server.requestTimeout = 30 * 60 * 1000;

  logger.log(`Immich Server is listening on ${await app.getUrl()} [v${serverVersion}] [${envName}] `);
}
