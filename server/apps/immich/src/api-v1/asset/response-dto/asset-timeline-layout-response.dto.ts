import { ApiProperty } from '@nestjs/swagger';

export class AssetTimelineLayout {
  timeBucket!: string;
  exifImageWidth!: number | null;
  exifImageHeight!: number | null;
  orientation!: number | null;
}

export class AssetTimelineLayoutResponseDto {
  @ApiProperty()
  timeBucket!: string;

  @ApiProperty({ type: 'integer' })
  ratio!: number;
}

export function mapAssetTimelineLayout(data: AssetTimelineLayout[]): AssetTimelineLayoutResponseDto[] {
  return data.map((asset) => {
    let height = asset?.exifImageHeight || 235;
    let width = asset?.exifImageWidth || 235;

    const orientation = Number(asset?.orientation);
    if (orientation) {
      if (orientation == 6 || orientation == -90) {
        [width, height] = [height, width];
      }
    }

    return {
      timeBucket: asset.timeBucket,
      ratio: width / height,
    };
  });
}
