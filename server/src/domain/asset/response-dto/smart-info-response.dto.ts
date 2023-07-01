import { SmartInfoEntity } from '@app/infra/entities/index.js';

export class SmartInfoResponseDto {
  tags?: string[] | null;
  objects?: string[] | null;
}

export function mapSmartInfo(entity: SmartInfoEntity): SmartInfoResponseDto {
  return {
    tags: entity.tags,
    objects: entity.objects,
  };
}
