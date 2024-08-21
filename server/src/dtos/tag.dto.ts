import { IsNotEmpty, IsString } from 'class-validator';
import { TagEntity } from 'src/entities/tag.entity';
import { ValidateUUID } from 'src/validation';

export class TagCreateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ValidateUUID({ optional: true, nullable: true })
  parentId?: string | null;
}

export class TagUpsertDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tags!: string[];
}

export class TagResponseDto {
  id!: string;
  name!: string;
  value!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export function mapTag(entity: TagEntity): TagResponseDto {
  return {
    id: entity.id,
    name: entity.value.split('/').at(-1) as string,
    value: entity.value,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
