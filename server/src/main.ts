import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { CommandFactory } from 'nest-commander';
import { existsSync } from 'node:fs';
import { Worker } from 'node:worker_threads';
import sirv from 'sirv';
import { ApiModule, ImmichAdminModule } from 'src/app.module';
import { LogLevel } from 'src/config';
import { WEB_ROOT, envName, excludePaths, isDev, serverVersion } from 'src/constants';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { ApiService } from 'src/services/api.service';
import { otelSDK } from 'src/utils/instrumentation';
import { useSwagger } from 'src/utils/misc';

const host = process.env.HOST;

async function bootstrapApi() {
  otelSDK.start();

  const port = Number(process.env.SERVER_PORT) || 3001;
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, { bufferLogs: true });
  const logger = await app.resolve(ILoggerRepository);

  logger.setAppName('ImmichServer');
  logger.setContext('ImmichServer');
  app.useLogger(logger);
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

  const server = await (host ? app.listen(port, host) : app.listen(port));
  server.requestTimeout = 30 * 60 * 1000;

  logger.log(`Immich Server is listening on ${await app.getUrl()} [v${serverVersion}] [${envName}] `);
}

const immichApp = process.argv[2] || process.env.IMMICH_APP;

if (process.argv[2] === immichApp) {
  process.argv.splice(2, 1);
}

async function bootstrapImmichAdmin() {
  process.env.LOG_LEVEL = LogLevel.WARN;
  await CommandFactory.run(ImmichAdminModule);
}

function bootstrapMicroservicesWorker() {
  const worker = new Worker('./dist/workers/microservices.js');
  worker.on('exit', (exitCode) => {
    if (exitCode !== 0) {
      console.error(`Microservices worker exited with code ${exitCode}`);
      process.exit(exitCode);
    }
  });
}

function bootstrap() {
  switch (immichApp) {
    case 'immich': {
      process.title = 'immich_server';
      if (process.env.INTERNAL_MICROSERVICES === 'true') {
        bootstrapMicroservicesWorker();
      }
      return bootstrapApi();
    }
    case 'microservices': {
      process.title = 'immich_microservices';
      return bootstrapMicroservicesWorker();
    }
    case 'immich-admin': {
      process.title = 'immich_admin_cli';
      return bootstrapImmichAdmin();
    }
    default: {
      throw new Error(`Invalid app name: ${immichApp}. Expected one of immich|microservices|immich-admin`);
    }
  }
}

void bootstrap();
