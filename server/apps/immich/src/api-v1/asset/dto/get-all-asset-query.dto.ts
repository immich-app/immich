import { IsOptional } from 'class-validator';

export class GetAllAssetQueryDto {
  @IsOptional()
  nextPageKey?: string;
}
