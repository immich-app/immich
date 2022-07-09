export class CheckDuplicateAssetResponseDto {
  constructor(isExist: boolean) {
    this.isExist = isExist;
  }
  isExist: boolean;
}
