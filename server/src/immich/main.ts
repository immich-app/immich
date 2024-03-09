import { envName, isDev, serverVersion } from '@app/domain';
import { WebSocketAdapter } from '@app/infra';
import { ImmichLogger } from '@app/infra/logger';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import sirv from 'sirv';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { useSwagger } from './app.utils';

const logger = new ImmichLogger('ImmichServer');
const port = Number(process.env.SERVER_PORT) || 3001;

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

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

  const excludePaths = ['/.well-known/immich', '/custom.css'];
  app.setGlobalPrefix('api', { exclude: excludePaths });
  // copied from https://github.com/sveltejs/kit/blob/679b5989fe62e3964b9a73b712d7b41831aa1f07/packages/adapter-node/src/handler.js#L46
  // provides serving of precompressed assets and caching of immutable assets
  app.use(
    sirv('www', {
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
  app.use(app.get(AppService).ssr(excludePaths));

  const server = await app.listen(port);
  server.requestTimeout = 30 * 60 * 1000;

  logger.log(`Immich Server is listening on ${await app.getUrl()} [v${serverVersion}] [${envName}] `);
}
