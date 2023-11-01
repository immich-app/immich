import { UserEntity } from '@app/infra/entities';

export enum UserAvatarColor {
  PRIMARY = 'primary',
  PINK = 'pink',
  RED = 'red',
  YELLOW = 'yellow',
  BLUE = 'blue',
  GREEN = 'green',
  PURPLE = 'purple',
  ORANGE = 'orange',
  GRAY = 'gray',
  AMBER = 'amber',
}

export const getRandomAvatarColor = (): UserAvatarColor => {
  const values = Object.values(UserAvatarColor);
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex] as UserAvatarColor;
}

export class UserDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  profileImagePath!: string;
  avatarColor!: UserAvatarColor;
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
    avatarColor: entity.avatarColor,
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
