import { IsNotEmpty } from 'class-validator';

export class RemoveAssetsFromSharedLinkDto {
  @IsNotEmpty()
  ids!: string[];
}
