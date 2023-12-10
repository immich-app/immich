export class MetricsServerInfoDto {
  version?: string;
  diskUse?: string;
}

export class MetricsAssetCountDto {
  photo?: number;
  video?: number;
}

export class MetricsDto {
  serverInfo!: MetricsServerInfoDto;
  assetCount!: MetricsAssetCountDto;
}
