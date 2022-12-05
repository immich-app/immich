import { TagEntity, TagType } from '@app/database/entities/tag.entity';
import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enumName: 'TagTypeEnum', enum: TagType })
  type!: string;

  name!: string;
}

export function mapTag(entity: TagEntity): TagResponseDto {
  return {
    id: entity.id,
    type: entity.type,
    name: entity.name,
  };
}
