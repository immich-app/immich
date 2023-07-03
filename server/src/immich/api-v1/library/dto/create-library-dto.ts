import { AssetType, LibraryType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLibraryDto {
  @IsNotEmpty()
  @IsEnum(LibraryType)
  @ApiProperty({ enumName: 'LibraryTypeEnum', enum: LibraryType })
  libraryType!: LibraryType;

  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
