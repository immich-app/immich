import { UserEntity } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  storageLabel!: string | null;
  externalPath!: string | null;
  profileImagePath!: string;
  shouldChangePassword!: boolean;
  isAdmin!: boolean;
  createdAt!: Date;
  deletedAt!: Date | null;
  updatedAt!: Date;
  oauthId!: string;
}

export class StatResponseDto {
  @ApiProperty({ type: 'integer' })
  hidden!: number;
  @ApiProperty({ type: 'integer' })
  visible!: number;
  @ApiProperty({ type: 'integer' })
  total!: number;
}

export function mapUser(entity: UserEntity): UserResponseDto {
  return {
    id: entity.id,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    storageLabel: entity.storageLabel,
    externalPath: entity.externalPath,
    profileImagePath: entity.profileImagePath,
    shouldChangePassword: entity.shouldChangePassword,
    isAdmin: entity.isAdmin,
    createdAt: entity.createdAt,
    deletedAt: entity.deletedAt,
    updatedAt: entity.updatedAt,
    oauthId: entity.oauthId,
  };
}
