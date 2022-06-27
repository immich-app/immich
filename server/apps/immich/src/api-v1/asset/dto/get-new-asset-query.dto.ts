import { IsNotEmpty } from 'class-validator';

export class GetNewAssetQueryDto {
  @IsNotEmpty()
  latestDate!: string;
}
