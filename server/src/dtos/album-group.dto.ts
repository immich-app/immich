import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { Group } from 'src/database';
import { GroupResponseDto, mapGroup } from 'src/dtos/group.dto';
import { AlbumUserRole } from 'src/enum';
import { ValidateEnum, ValidateUUID } from 'src/validation';

export class AlbumGroupCreateAllDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlbumGroupDto)
  groups!: AlbumGroupDto[];
}

export class AlbumGroupDeleteAllDto {
  @ValidateUUID({ each: true })
  groupIds!: string[];
}

export class AlbumGroupDto {
  @ValidateUUID()
  groupId!: string;

  @ValidateEnum({ enum: AlbumUserRole, name: 'AlbumUserRole', optional: true })
  role?: AlbumUserRole;
}

export class AlbumGroupUpdateDto {
  @ValidateEnum({ enum: AlbumUserRole, name: 'AlbumUserRole' })
  role!: AlbumUserRole;
}

export class AlbumGroupResponseDto extends GroupResponseDto {
  metadata!: AlbumGroupMetadata;
}

export class AlbumGroupMetadata {
  createdAt!: Date;
  updatedAt!: Date;
}

type AlbumGroup = {
  createdAt: Date;
  updatedAt: Date;
  group: Group;
};

export const mapAlbumGroup = (albumGroup: AlbumGroup): AlbumGroupResponseDto => {
  return {
    ...mapGroup(albumGroup.group),
    metadata: {
      createdAt: albumGroup.createdAt,
      updatedAt: albumGroup.updatedAt,
    },
  };
};
