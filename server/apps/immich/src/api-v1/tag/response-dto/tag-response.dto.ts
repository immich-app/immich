import { Tag, TagType } from '@app/common';
import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  id!: string;
  @ApiProperty({ enumName: 'TagTypeEnum', enum: TagType })
  type!: string;
  name!: string;
  userId!: string;
  renameTagId?: string | null;
}

export function mapTag(entity: Tag): TagResponseDto {
  return {
    id: entity.id,
    type: entity.type,
    name: entity.name,
    userId: entity.userId,
    renameTagId: entity.renameTagId,
  };
}
