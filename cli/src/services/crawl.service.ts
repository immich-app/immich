import { ACCEPTED_FILE_EXTENSIONS } from '../cores';
import { glob } from 'glob';

export class CrawlService {
  public async crawl(pathsToCrawl: string[], recursive: boolean): Promise<string[]> {
    let paths: string;
    if (pathsToCrawl.length === 1) {
      paths = pathsToCrawl[0];
    } else {
      paths = '{' + pathsToCrawl.join(',') + '}';
    }

    if (recursive) {
      paths = paths + '/**/';
    }

    paths = paths + '/*.{' + ACCEPTED_FILE_EXTENSIONS.join(',') + '}';
    return await glob(paths, { nocase: true, nodir: true });
  }
}
