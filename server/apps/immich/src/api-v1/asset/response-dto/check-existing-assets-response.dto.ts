export class CheckExistingAssetsResponseDto {
  constructor(paths: string[], actions: string[], reasons: string[]) {
    this.paths = paths;
    this.actions = actions;
    this.reasons = reasons;
  }
  paths!: string[];
  // "Accept" or "Reject"
  actions!: string[];
  // empty or "Duplicate"
  // In the future we might also do "Unsupported" if we want to pre-upload mime type checks etc.
  reasons?: string[];
}
