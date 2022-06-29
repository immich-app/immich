import { IsNotEmpty } from 'class-validator';

export class DeleteAssetDto {
  @IsNotEmpty()
  ids!: string[];
}
