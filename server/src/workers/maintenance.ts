import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MaintenanceModule } from 'src/app.module';
import { serverVersion } from 'src/constants';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MaintenanceWorkerRepository } from 'src/repositories/maintenance-worker.repository';
import { isStartUpError } from 'src/utils/misc';
async function bootstrap() {
  process.title = 'immich-maintenance';

  // const { telemetry, network } = new ConfigRepository().getEnv();
  // if (telemetry.metrics.size > 0) {
  //   bootstrapTelemetry(telemetry.apiPort);
  // }

  const app = await NestFactory.create<NestExpressApplication>(MaintenanceModule, { bufferLogs: true });
  const logger = await app.resolve(LoggingRepository);
  const configRepository = app.get(ConfigRepository);
  app.get(MaintenanceWorkerRepository).setCloseFn(() => app.close());

  const { environment, host, port, resourcePaths } = configRepository.getEnv();

  // logger.setContext('Bootstrap');
  // app.useLogger(logger);
  // app.set('trust proxy', ['loopback', ...network.trustedProxies]);
  // app.set('etag', 'strong');
  // app.use(cookieParser());
  // app.use(json({ limit: '10mb' }));
  // if (configRepository.isDev()) {
  //   app.enableCors();
  // }
  app.useWebSocketAdapter(new WebSocketAdapter(app));
  // useSwagger(app, { write: configRepository.isDev() });

  // app.setGlobalPrefix('api', { exclude: excludePaths });
  // if (existsSync(resourcePaths.web.root)) {
  //   // copied from https://github.com/sveltejs/kit/blob/679b5989fe62e3964b9a73b712d7b41831aa1f07/packages/adapter-node/src/handler.js#L46
  //   // provides serving of precompressed assets and caching of immutable assets
  //   app.use(
  //     sirv(resourcePaths.web.root, {
  //       etag: true,
  //       gzip: true,
  //       brotli: true,
  //       extensions: [],
  //       setHeaders: (res, pathname) => {
  //         if (pathname.startsWith(`/_app/immutable`) && res.statusCode === 200) {
  //           res.setHeader('cache-control', 'public,max-age=31536000,immutable');
  //         }
  //       },
  //     }),
  //   );
  // }
  // app.use(app.get(ApiService).ssr(excludePaths));
  // app.use(compression());

  const server = await (host ? app.listen(port, host) : app.listen(port));
  server.requestTimeout = 24 * 60 * 60 * 1000;

  logger.log(`Immich Server is listening on ${await app.getUrl()} [v${serverVersion}] [${environment}] `);
}

bootstrap().catch((error) => {
  if (!isStartUpError(error)) {
    console.error(error);
  }
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
