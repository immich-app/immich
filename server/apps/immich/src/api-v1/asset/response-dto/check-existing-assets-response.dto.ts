export class CheckExistingAssetsResponseDto {
  constructor(existingIds: (string | null)[]) {
    this.existingIds = existingIds;
  }
  existingIds: (string | null)[];
}
