import { UserTokenEntity } from '@app/infra/entities';

export class AuthDeviceResponseDto {
  id!: string;
  createdAt!: string;
  updatedAt!: string;
  current!: boolean;
  deviceType!: string;
  deviceOS!: string;
}

export const mapUserToken = (entity: UserTokenEntity, currentId?: string): AuthDeviceResponseDto => ({
  id: entity.id,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
  current: currentId === entity.id,
  deviceOS: entity.deviceOS,
  deviceType: entity.deviceType,
});
