import { SmartInfoEntity } from '@app/database/entities/smart-info.entity';

export interface SmartInfo {
  id: string;
  tags: string[] | null;
  objects: string[] | null;
}

export function mapSmartInfo(entity: SmartInfoEntity): SmartInfo {
  return {
    id: entity.id,
    tags: entity.tags,
    objects: entity.objects,
  };
}
