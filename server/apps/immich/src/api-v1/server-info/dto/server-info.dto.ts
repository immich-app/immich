// TODO: this is being used as a response DTO. Should be changed to interface
export class ServerInfoDto {
  diskSize!: string;
  diskUse!: string;
  diskAvailable!: string;
  diskSizeRaw!: number;
  diskUseRaw!: number;
  diskAvailableRaw!: number;
  diskUsagePercentage!: number;
}
