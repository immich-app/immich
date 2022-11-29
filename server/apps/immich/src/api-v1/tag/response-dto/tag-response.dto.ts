import { TagEntity, TagType } from '@app/database/entities/tag.entity';
import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ type: 'integer', format: 'int64' })
  id!: number;

  @ApiProperty({ enumName: 'TagTypeEnum', enum: TagType })
  type!: string;

  tag!: string;
}

export function mapTag(entity: TagEntity): TagResponseDto {
  return {
    id: entity.id,
    type: entity.type,
    tag: entity.tag,
  };
}
