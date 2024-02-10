import { glob } from 'glob';
import * as fs from 'node:fs';

export class CrawlOptions {
  pathsToCrawl!: string[];
  recursive? = false;
  includeHidden? = false;
  exclusionPatterns?: string[];
}

export class CrawlService {
  private readonly extensions!: string[];

  constructor(image: string[], video: string[]) {
    this.extensions = [...image, ...video].map((extension) => extension.replace('.', ''));
  }

  async crawl(options: CrawlOptions): Promise<string[]> {
    const { recursive, pathsToCrawl, exclusionPatterns, includeHidden } = options;

    if (!pathsToCrawl) {
      return [];
    }

    const patterns: string[] = [];
    const crawledFiles: string[] = [];

    for await (const currentPath of pathsToCrawl) {
      try {
        const stats = await fs.promises.stat(currentPath);
        if (stats.isFile() || stats.isSymbolicLink()) {
          crawledFiles.push(currentPath);
        } else {
          patterns.push(currentPath);
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          patterns.push(currentPath);
        } else {
          throw error;
        }
      }
    }

    let searchPattern: string;
    if (patterns.length === 1) {
      searchPattern = patterns[0];
    } else if (patterns.length === 0) {
      return crawledFiles;
    } else {
      searchPattern = '{' + patterns.join(',') + '}';
    }

    if (recursive) {
      searchPattern = searchPattern + '/**/';
    }

    searchPattern = `${searchPattern}/*.{${this.extensions.join(',')}}`;

    const globbedFiles = await glob(searchPattern, {
      absolute: true,
      nocase: true,
      nodir: true,
      dot: includeHidden,
      ignore: exclusionPatterns,
    });

    return [...crawledFiles, ...globbedFiles].sort();
  }
}
