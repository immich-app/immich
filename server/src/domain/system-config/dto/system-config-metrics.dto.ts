import { MetricServerInfoConfig, MetricsAssetCountConfig } from '@app/domain';
import { Type } from 'class-transformer';
import { IsBoolean, IsObject, ValidateNested } from 'class-validator';

export class SystemConfigMetricsDto {
  @IsBoolean()
  enabled!: boolean;

  @Type(() => MetricServerInfoConfig)
  @ValidateNested()
  @IsObject()
  serverInfo!: MetricServerInfoConfig;

  @Type(() => MetricsAssetCountConfig)
  @ValidateNested()
  @IsObject()
  assetCount!: MetricsAssetCountConfig;
}
