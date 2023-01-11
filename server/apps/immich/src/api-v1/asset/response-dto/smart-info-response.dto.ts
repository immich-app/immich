import { SmartInfoEntity } from '@app/infra';

export class SmartInfoResponseDto {
  id?: string;
  tags?: string[] | null;
  objects?: string[] | null;
}

export function mapSmartInfo(entity: SmartInfoEntity): SmartInfoResponseDto {
  return {
    id: entity.id,
    tags: entity.tags,
    objects: entity.objects,
  };
}
