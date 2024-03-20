import { ApiProperty } from '@nestjs/swagger';
import { TagEntity, TagType } from 'src/infra/entities/tag.entity';

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
