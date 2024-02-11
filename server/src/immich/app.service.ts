import {
  AuthService,
  DatabaseService,
  JobService,
  LibraryService,
  ONE_HOUR,
  OpenGraphTags,
  ServerInfoService,
  SharedLinkService,
  StorageService,
  SystemConfigService,
  WEB_ROOT_PATH,
} from '@app/domain';
import { ImmichLogger } from '@app/infra/logger';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { NextFunction, Request, Response } from 'express';
import { readFileSync } from 'node:fs';

const render = (index: string, meta: OpenGraphTags) => {
  const tags = `
    <meta name="description" content="${meta.description}" />

    <!-- Facebook Meta Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    ${meta.imageUrl ? `<meta property="og:image" content="${meta.imageUrl}" />` : ''}

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${meta.title}" />
    <meta name="twitter:description" content="${meta.description}" />

    ${meta.imageUrl ? `<meta name="twitter:image" content="${meta.imageUrl}" />` : ''}`;

  return index.replace('<!-- metadata:tags -->', tags);
};

@Injectable()
export class AppService {
  private logger = new ImmichLogger(AppService.name);

  constructor(
    private authService: AuthService,
    private configService: SystemConfigService,
    private jobService: JobService,
    private libraryService: LibraryService,
    private serverService: ServerInfoService,
    private sharedLinkService: SharedLinkService,
    private storageService: StorageService,
    private databaseService: DatabaseService,
  ) {}

  @Interval(ONE_HOUR.as('milliseconds'))
  async onVersionCheck() {
    await this.serverService.handleVersionCheck();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async onNightlyJob() {
    await this.jobService.handleNightlyJobs();
  }

  async init() {
    await this.databaseService.init();
    await this.configService.init();
    this.storageService.init();
    await this.libraryService.init();
    await this.serverService.init();
    this.logger.log(`Feature Flags: ${JSON.stringify(await this.serverService.getFeatures(), null, 2)}`);
  }

  async teardown() {
    await this.libraryService.unwatchAll();
  }

  ssr(excludePaths: string[]) {
    let index = '';
    try {
      index = readFileSync(WEB_ROOT_PATH).toString();
    } catch {
      this.logger.warn('Unable to open `www/index.html, skipping SSR.');
    }

    return async (request: Request, res: Response, next: NextFunction) => {
      if (
        request.url.startsWith('/api') ||
        request.method.toLowerCase() !== 'get' ||
        excludePaths.some((item) => request.url.startsWith(item))
      ) {
        return next();
      }

      const targets = [
        {
          regex: /^\/share\/(.+)$/,
          onMatch: async (matches: RegExpMatchArray) => {
            const key = matches[1];
            const auth = await this.authService.validateSharedLink(key);
            return this.sharedLinkService.getMetadataTags(auth);
          },
        },
      ];

      let html = index;

      try {
        for (const { regex, onMatch } of targets) {
          const matches = request.url.match(regex);
          if (matches) {
            const meta = await onMatch(matches);
            if (meta) {
              html = render(index, meta);
            }

            break;
          }
        }
      } catch {}

      res.type('text/html').header('Cache-Control', 'no-store').send(html);
    };
  }
}
