import { ArrayNotEmpty } from 'class-validator';
import { User } from 'src/database';
import { mapUser, UserResponseDto } from 'src/dtos/user.dto';
import { ValidateUUID } from 'src/validation';

export class GroupUserCreateAllDto {
  @ArrayNotEmpty()
  users!: GroupUserDto[];
}

export class GroupUserDeleteAllDto {
  @ValidateUUID({ each: true })
  userIds!: string[];
}

export class GroupUserDto {
  @ValidateUUID()
  userId!: string;

  // TODO potentially add a role UserGroupRole field here
}

export class GroupUserResponseDto extends UserResponseDto {
  metadata!: GroupUserMetadata;
}

export class GroupUserMetadata {
  createdAt!: Date;
  updatedAt!: Date;
}

type GroupUser = {
  createdAt: Date;
  updatedAt: Date;
  user: User;
};

export const mapGroupUser = (groupUser: GroupUser): GroupUserResponseDto => {
  return {
    ...mapUser(groupUser.user),
    metadata: {
      createdAt: groupUser.createdAt,
      updatedAt: groupUser.updatedAt,
    },
  };
};
