import { TagEntity, TagType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';

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
