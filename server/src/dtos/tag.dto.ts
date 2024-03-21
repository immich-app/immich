import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TagEntity, TagType } from 'src/entities/tag.entity';
import { Optional } from 'src/validation';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(TagType)
  @IsNotEmpty()
  @ApiProperty({ enumName: 'TagTypeEnum', enum: TagType })
  type!: TagType;
}

export class UpdateTagDto {
  @IsString()
  @Optional()
  name?: string;
}

export class TagResponseDto {
  id!: string;
  @ApiProperty({ enumName: 'TagTypeEnum', enum: TagType })
  type!: string;
  name!: string;
  userId!: string;
}

export function mapTag(entity: TagEntity): TagResponseDto {
  return {
    id: entity.id,
    type: entity.type,
    name: entity.name,
    userId: entity.userId,
  };
}
