import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { FamilyMember } from 'src/database';

export class CreateFamilyMemberDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ description: 'Name of the family member' })
  name!: string;

  @IsDateString()
  @ApiProperty({ description: 'Birthdate in ISO format (YYYY-MM-DD)' })
  birthdate!: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #FF5733)' })
  @ApiPropertyOptional({ description: 'Hex color for UI display (e.g., #FF5733)' })
  color?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Asset ID to use as avatar' })
  avatarAssetId?: string;
}

export class UpdateFamilyMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ description: 'Name of the family member' })
  name?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Birthdate in ISO format (YYYY-MM-DD)' })
  birthdate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #FF5733)' })
  @ApiPropertyOptional({ description: 'Hex color for UI display (e.g., #FF5733)' })
  color?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Asset ID to use as avatar' })
  avatarAssetId?: string;
}

export class FamilyMemberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  birthdate!: string;

  @ApiProperty()
  tagId!: string;

  @ApiPropertyOptional()
  color?: string | null;

  @ApiPropertyOptional()
  avatarAssetId?: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export function mapFamilyMember(entity: FamilyMember): FamilyMemberResponseDto {
  return {
    id: entity.id,
    name: entity.name,
    birthdate: entity.birthdate,
    tagId: entity.tagId,
    color: entity.color,
    avatarAssetId: entity.avatarAssetId,
    createdAt: entity.createdAt,
  };
}
