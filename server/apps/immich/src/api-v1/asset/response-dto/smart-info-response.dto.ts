import { SmartInfoEntity } from '@app/database/entities/smart-info.entity';

export interface SmartInfoResponseDto {
  id: string;
  tags: string[] | null;
  objects: string[] | null;
}

export function mapSmartInfo(entity: SmartInfoEntity): SmartInfoResponseDto {
  return {
    id: entity.id,
    tags: entity.tags,
    objects: entity.objects,
  };
}
