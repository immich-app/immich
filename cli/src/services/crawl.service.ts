import { CrawlOptionsDto } from 'src/cores/dto/crawl-options-dto';
import { glob } from 'glob';

export class CrawlService {
  private readonly extensions!: string[];

  constructor(image: string[], video: string[]) {
    this.extensions = image.concat(video).map((extension) => extension.replace('.', ''));
  }

  crawl(crawlOptions: CrawlOptionsDto): Promise<string[]> {
    const { pathsToCrawl, exclusionPatterns, includeHidden } = crawlOptions;
    if (!pathsToCrawl) {
      return Promise.resolve([]);
    }

    const base = pathsToCrawl.length === 1 ? pathsToCrawl[0] : `{${pathsToCrawl.join(',')}}`;
    const extensions = `*{${this.extensions}}`;

    return glob(`${base}/**/${extensions}`, {
      absolute: true,
      nocase: true,
      nodir: true,
      dot: includeHidden,
      ignore: exclusionPatterns,
    });
  }
}
