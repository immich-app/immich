export class MetricsServerInfoDto {
  cpuCount?: number;
  cpuModel?: string;
  memoryCount?: number;
  version?: string;
}

export class MetricsAssetCountDto {
  image?: number;
  video?: number;
  total?: number;
}

export class MetricsDto {
  serverInfo!: MetricsServerInfoDto;
  assetCount!: MetricsAssetCountDto;
}
