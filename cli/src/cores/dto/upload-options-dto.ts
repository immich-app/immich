export class UploadOptionsDto {
  recursive? = false;
  exclusionPatterns?: string[] = [];
  dryRun? = false;
  skipHash? = false;
  delete? = false;
  album? = false;
}
