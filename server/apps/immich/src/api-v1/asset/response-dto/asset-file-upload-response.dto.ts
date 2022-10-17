export class AssetFileUploadResponseDto {
  constructor(id: string, isDuplicated: boolean) {
    this.id = id;
    this.isDuplicated = isDuplicated;
  }

  id: string;
  isDuplicated: boolean;
}
