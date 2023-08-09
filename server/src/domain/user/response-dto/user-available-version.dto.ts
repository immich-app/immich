export class AvailableVersionResponseDto {
  availableVersion!: SystemConfigImmichVersion | null;
}
class SystemConfigImmichVersion {
  major!: number;
  minor!: number;
  patch!: number;
}
