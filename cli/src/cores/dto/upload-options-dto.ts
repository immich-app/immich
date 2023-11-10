export class UploadOptionsDto {
  recursive = false;
  excludePatterns!: string[];
  dryRun = false;
  skipHash = false;
  delete = false;
  readOnly = true;
}
