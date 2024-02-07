import pm from 'picomatch';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

    const matcher = pm(searchPattern, {
      nocase: true,
      dot: includeHidden,
      ignore: exclusionPatterns,
    });
    const globbedFiles = findMatchingFiles(matcher, process.cwd());

    return [...crawledFiles, ...globbedFiles].sort();
  }
}

function findMatchingFiles(matcher: pm.Matcher, directory: string): string[] {
  let matchingFiles: string[] = [];

  const files = fs.readdirSync(directory);
  for (const file of files) {
    const filePath = path.join(directory, file);
    const isDirectory = fs.statSync(filePath).isDirectory();

    if (isDirectory) {
      // Recursively search in sub-directories
      matchingFiles = [...matchingFiles, ...findMatchingFiles(matcher, filePath)];
    } else {
      // Check if the file matches the pattern
      if (matcher(file)) {
        matchingFiles.push(filePath);
      }
    }
  };

  return matchingFiles;
}
