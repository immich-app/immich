export class CrawlOptionsDto {
  pathsToCrawl!: string[];
  recursive = false;
  includeHidden = false;
  excludePatterns!: string[];
}
