import { TagEntity, TagType } from '@app/infra/db/entities';
import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enumName: 'TagTypeEnum', enum: TagType })
  type!: string;

  name!: string;

  userId!: string;

  renameTagId?: string | null;
}

export function mapTag(entity: TagEntity): TagResponseDto {
  return {
    id: entity.id,
    type: entity.type,
    name: entity.name,
    userId: entity.userId,
    renameTagId: entity.renameTagId,
  };
}
