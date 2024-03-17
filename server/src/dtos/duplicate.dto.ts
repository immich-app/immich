import { IsNotEmpty } from 'class-validator';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { ValidateUUID } from 'src/validation';

export class DuplicateResponseDto {
  duplicateId!: string;
  assets!: AssetResponseDto[];
}

export class ResolveDuplicatesDto {
  @IsNotEmpty()
  @ValidateUUID({ each: true })
  assetIds!: string[];
}
