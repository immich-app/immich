import { CrawlOptionsDto } from 'src/cores/dto/crawl-options-dto';
import { ACCEPTED_FILE_EXTENSIONS } from '../cores';
import { glob } from 'glob';
import * as fs from 'fs';

export class CrawlService {
  public async crawl(crawlOptions: CrawlOptionsDto): Promise<string[]> {
    const pathsToCrawl: string[] = crawlOptions.pathsToCrawl;

    const directories: string[] = [];
    const crawledFiles: string[] = [];

    for await (const currentPath of pathsToCrawl) {
      const stats = await fs.promises.stat(currentPath);
      if (stats.isFile() || stats.isSymbolicLink()) {
        crawledFiles.push(currentPath);
      } else {
        directories.push(currentPath);
      }
    }

    let searchPattern: string;
    if (directories.length === 1) {
      searchPattern = directories[0];
    } else if (directories.length === 0) {
      return crawledFiles;
    } else {
      searchPattern = '{' + directories.join(',') + '}';
    }

    if (crawlOptions.recursive) {
      searchPattern = searchPattern + '/**/';
    }

    searchPattern = `${searchPattern}/*.{${ACCEPTED_FILE_EXTENSIONS.join(',')}}`;

    const globbedFiles = await glob(searchPattern, {
      nocase: true,
      nodir: true,
      ignore: crawlOptions.excludePatterns,
    });

    const returnedFiles = crawledFiles.concat(globbedFiles);
    returnedFiles.sort();
    return returnedFiles;
  }
}
