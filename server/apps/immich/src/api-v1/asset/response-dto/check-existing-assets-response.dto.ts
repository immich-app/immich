export class CheckExistingAssetsResponseDto {
    constructor(existingIds: string[]) {
      this.existingIds = existingIds;
    }
    existingIds: string[];
  }
  