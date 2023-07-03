import { LibraryEntity, LibraryType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';

export class LibraryResponseDto {
  id!: string;
  ownerId!: string;

  @ApiProperty({ enumName: 'LibraryTypeEnum', enum: LibraryType })
  type!: LibraryType;

  createdAt!: Date;
  updatedAt!: Date;
  refreshedAt!: Date;
}

export function mapLibrary(entity: LibraryEntity): LibraryResponseDto {
  return {
    id: entity.id,
    ownerId: entity.ownerId,
    type: entity.type,

    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    refreshedAt: entity.refreshedAt,
  };
}
