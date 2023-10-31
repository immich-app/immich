import { UserEntity } from '@app/infra/entities';

export class UserDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  profileImagePath!: string;
}

export class UserResponseDto extends UserDto {
  storageLabel!: string | null;
  externalPath!: string | null;
  shouldChangePassword!: boolean;
  isAdmin!: boolean;
  createdAt!: Date;
  deletedAt!: Date | null;
  updatedAt!: Date;
  oauthId!: string;
  memoriesEnabled?: boolean;
}

export const mapSimpleUser = (entity: UserEntity): UserDto => {
  return {
    id: entity.id,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    profileImagePath: entity.profileImagePath,
  };
};

export function mapUser(entity: UserEntity): UserResponseDto {
  return {
    ...mapSimpleUser(entity),
    storageLabel: entity.storageLabel,
    externalPath: entity.externalPath,
    shouldChangePassword: entity.shouldChangePassword,
    isAdmin: entity.isAdmin,
    createdAt: entity.createdAt,
    deletedAt: entity.deletedAt,
    updatedAt: entity.updatedAt,
    oauthId: entity.oauthId,
    memoriesEnabled: entity.memoriesEnabled,
  };
}
