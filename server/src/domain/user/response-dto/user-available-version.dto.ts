export class AvailableVersionResponseDto {
  available!: boolean;

  availableVersion?: SystemConfigImmichVersion;
}
class SystemConfigImmichVersion {
  major!: number;
  minor!: number;
  patch!: number;
}
