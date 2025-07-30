import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Group, GroupAdmin } from 'src/database';
import { GroupUserDto } from 'src/dtos/group-user.dto';
import { Optional, ValidateUUID } from 'src/validation';

export class GroupAdminSearchDto {
  @ValidateUUID({ optional: true })
  id?: string;

  @ValidateUUID({ optional: true })
  userId?: string;
}

export class GroupAdminCreateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Optional({ nullable: true, emptyToNull: true })
  @IsNotEmpty()
  @IsString()
  description?: string | null;

  @Optional()
  @ValidateNested({ each: true })
  @Type(() => GroupUserDto)
  @IsArray()
  users?: GroupUserDto[];
}

export class GroupAdminUpdateDto {
  @Optional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Optional({ nullable: true, emptyToNull: true })
  @IsNotEmpty()
  @IsString()
  description?: string | null;
}

export class GroupResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
}

export class GroupAdminResponseDto extends GroupResponseDto {
  createdAt!: Date;
  updatedAt!: Date;
}

export const mapGroup = (group: Group | GroupAdmin) => {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
  };
};

export const mapGroupAdmin = (group: GroupAdmin) => {
  return {
    ...mapGroup(group),
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
};
