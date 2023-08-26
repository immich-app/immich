import { EntityType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class AuditDeletesDto {
  @IsDate()
  @Type(() => Date)
  after!: Date;

  @ApiProperty({ enum: EntityType, enumName: 'EntityType' })
  @IsEnum(EntityType)
  entityType!: EntityType;

  @IsOptional()
  @IsUUID('4')
  @ApiProperty({ format: 'uuid' })
  userId?: string;
}

export class AuditDeletesResponseDto {
  needsFullSync!: boolean;
  ids!: string[];
}
