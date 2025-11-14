import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import helmet from 'helmet';
import sirv from 'sirv';
import { ApiModule } from 'src/app.module';
import { excludePaths, serverVersion } from 'src/constants';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { bootstrapTelemetry } from 'src/repositories/telemetry.repository';
import { ApiService } from 'src/services/api.service';
import { isStartUpError, useSwagger } from 'src/utils/misc';
async function bootstrap() {
  process.title = 'immich-api';

  const { telemetry, network } = new ConfigRepository().getEnv();
  if (telemetry.metrics.size > 0) {
    bootstrapTelemetry(telemetry.apiPort);
  }

  const app = await NestFactory.create<NestExpressApplication>(ApiModule, { bufferLogs: true });
  const logger = await app.resolve(LoggingRepository);
  const configRepository = app.get(ConfigRepository);
  const { environment, host, port, resourcePaths, security } = configRepository.getEnv();

  logger.setContext('Bootstrap');
  app.useLogger(logger);
  app.set('trust proxy', ['loopback', ...network.trustedProxies]);
  app.set('etag', 'strong');
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'no-referrer' },
      hsts: security.enforceSecureCookies
        ? { maxAge: 60 * 60 * 24 * 180, includeSubDomains: true, preload: true }
        : false,
    }),
  );
  if (configRepository.isDev()) {
    app.enableCors();
  }
  app.useWebSocketAdapter(new WebSocketAdapter(app));
  useSwagger(app, { write: configRepository.isDev() });

  const globalRateLimiter = rateLimit({
    windowMs: security.rateLimit.windowMs,
    limit: security.rateLimit.max,
    max: security.rateLimit.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  const loginRateLimiter = rateLimit({
    windowMs: security.rateLimit.loginWindowMs,
    limit: security.rateLimit.loginMax,
    max: security.rateLimit.loginMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  app.setGlobalPrefix('api', { exclude: excludePaths });
  app.use('/api', globalRateLimiter);
  app.use('/api/auth/login', loginRateLimiter);
  app.use('/api/oauth/callback', loginRateLimiter);
  if (existsSync(resourcePaths.web.root)) {
    // copied from https://github.com/sveltejs/kit/blob/679b5989fe62e3964b9a73b712d7b41831aa1f07/packages/adapter-node/src/handler.js#L46
    // provides serving of precompressed assets and caching of immutable assets
    app.use(
      sirv(resourcePaths.web.root, {
        etag: true,
        gzip: true,
        brotli: true,
        extensions: [],
        setHeaders: (res, pathname) => {
          if (pathname.startsWith(`/_app/immutable`) && res.statusCode === 200) {
            res.setHeader('cache-control', 'public,max-age=31536000,immutable');
          }
        },
      }),
    );
  }
  app.use(app.get(ApiService).ssr(excludePaths));
  app.use(compression());

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
