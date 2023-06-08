import { IsNotEmpty } from 'class-validator';

export class SearchAssetDto {
  @IsNotEmpty()
  searchTerm!: string;
}
