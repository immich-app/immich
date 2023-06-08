export class CheckDuplicateAssetResponseDto {
  constructor(isExist: boolean, id?: string) {
    this.isExist = isExist;
    this.id = id;
  }
  isExist: boolean;
  id?: string;
}
