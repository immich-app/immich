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
