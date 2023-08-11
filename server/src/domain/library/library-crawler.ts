import { glob } from 'glob';
import { mimeTypes } from '..';
import { CrawlOptionsDto } from './library.dto';

export class LibraryCrawler {
  public async findAllMedia(crawlOptions: CrawlOptionsDto): Promise<string[]> {
    const pathsToCrawl = crawlOptions.pathsToCrawl;

    let paths: string;
    if (!pathsToCrawl) {
      // No paths to crawl, return empty list
      return [];
    } else if (pathsToCrawl.length === 1) {
      paths = pathsToCrawl[0];
    } else {
      paths = '{' + pathsToCrawl.join(',') + '}';
    }

    paths = paths + '/**/*{' + mimeTypes.getSupportedFileExtensions().join(',') + '}';

    return await glob(paths, { nocase: true, nodir: true, ignore: crawlOptions.excludePatterns });
  }
}
