import { UserEntity } from '@app/infra/entities';

export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  storageLabel!: string | null;
  createdAt!: string;
  profileImagePath!: string;
  shouldChangePassword!: boolean;
  isAdmin!: boolean;
  deletedAt?: Date;
  updatedAt?: string;
  oauthId!: string;
}

export function mapUser(entity: UserEntity): UserResponseDto {
  return {
    id: entity.id,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    storageLabel: entity.storageLabel,
    createdAt: entity.createdAt,
    profileImagePath: entity.profileImagePath,
    shouldChangePassword: entity.shouldChangePassword,
    isAdmin: entity.isAdmin,
    deletedAt: entity.deletedAt,
    updatedAt: entity.updatedAt,
    oauthId: entity.oauthId,
  };
}
