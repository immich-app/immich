import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { NextFunction, Request, Response } from 'express';
import { readFileSync } from 'node:fs';
import { ONE_HOUR } from 'src/constants';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AuthService } from 'src/services/auth.service';
import { JobService } from 'src/services/job.service';
import { SharedLinkService } from 'src/services/shared-link.service';
import { VersionService } from 'src/services/version.service';
import { OpenGraphTags } from 'src/utils/misc';

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
export class ApiService {
  constructor(
    private authService: AuthService,
    private jobService: JobService,
    private sharedLinkService: SharedLinkService,
    private versionService: VersionService,
    @Inject(IConfigRepository) private configRepository: IConfigRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(ApiService.name);
  }

  @Interval(ONE_HOUR.as('milliseconds'))
  async onVersionCheck() {
    await this.versionService.handleQueueVersionCheck();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async onNightlyJob() {
    await this.jobService.handleNightlyJobs();
  }

  ssr(excludePaths: string[]) {
    const { resourcePaths } = this.configRepository.getEnv();

    let index = '';
    try {
      index = readFileSync(resourcePaths.web.indexHtml).toString();
    } catch {
      this.logger.warn(`Unable to open ${resourcePaths.web.indexHtml}, skipping SSR.`);
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
