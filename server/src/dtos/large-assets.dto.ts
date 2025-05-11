import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';

export class LargeAssetsResponseDto {
  assets!: AssetResponseDto[];
}

export class GetLargeAssetsRequestDto {
  @IsNotEmpty()
  take!: number
}
