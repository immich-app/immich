export class UploadOptionsDto {
  recursive = false;
  exclusionPatterns!: string[];
  dryRun = false;
  skipHash = false;
  delete = false;
  readOnly = true;
  album = false;
}
