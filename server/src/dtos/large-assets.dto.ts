import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';

export class LargeAssetsResponseDto {
  assets!: AssetResponseDto[];
}

export class GetLargeAssetsRequestDto {
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  take!: number;
}
