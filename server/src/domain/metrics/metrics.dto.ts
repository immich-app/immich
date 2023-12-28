import { IsBoolean } from 'class-validator';

// TODO I feel like it must be possible to generate those from MetricsServerInfo and MetricsAssetCount
export class MetricServerInfoConfig {
  @IsBoolean()
  cpuCount!: boolean;

  @IsBoolean()
  cpuModel!: boolean;

  @IsBoolean()
  memory!: boolean;

  @IsBoolean()
  version!: boolean;
}

export class MetricsAssetCountConfig {
  @IsBoolean()
  image!: boolean;

  @IsBoolean()
  video!: boolean;

  @IsBoolean()
  total!: boolean;
}

class MetricsServerInfo {
  cpuCount!: number;
  cpuModel!: string;
  memory!: number;
  version!: string;
}

class MetricsAssetCount {
  image!: number;
  video!: number;
  total!: number;
}

export interface Metrics {
  serverInfo: {
    cpuCount: number;
    cpuModel: string;
    memory: number;
    version: string;
  };
  assetCount: {
    image: number;
    video: number;
    total: number;
  };
}

export class MetricsDto implements Metrics {
  serverInfo!: MetricsServerInfo;
  assetCount!: MetricsAssetCount;
}
