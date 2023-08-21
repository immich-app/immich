import { AuditEntity, DatabaseAction, EntityType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';

export class AuditResponseDto {
  @ApiProperty({ enumName: 'EntityType', enum: EntityType })
  entityType!: EntityType;
  entityId!: string;
  @ApiProperty({ enumName: 'DatabaseAction', enum: DatabaseAction })
  action!: DatabaseAction;
  ownerId!: string;
  time!: Date;
}

export function mapAuditRecord(entity: AuditEntity): AuditResponseDto {
  return entity;
}
