import { CrawlOptionsDto } from 'src/cores/dto/crawl-options-dto';
import { ACCEPTED_FILE_EXTENSIONS } from '../cores';
import { glob } from 'glob';
export class CrawlService {
  public async crawl(crawlOptions: CrawlOptionsDto): Promise<string[]> {
    const pathsToCrawl = crawlOptions.pathsToCrawl;

    let paths: string;
    if (pathsToCrawl.length === 1) {
      paths = pathsToCrawl[0];
    } else {
      paths = '{' + pathsToCrawl.join(',') + '}';
    }

    if (crawlOptions.recursive) {
      paths = paths + '/**/';
    }

    paths = paths + '/*.{' + ACCEPTED_FILE_EXTENSIONS.join(',') + '}';

    return await glob(paths, { nocase: true, nodir: true, ignore: crawlOptions.excludePatterns }).then((crawledPaths) =>
      crawledPaths.sort(),
    );
  }
}
