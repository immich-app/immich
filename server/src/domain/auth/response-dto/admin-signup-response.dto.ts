import { UserEntity } from '@app/infra/entities';

export class AdminSignupResponseDto {
  id!: string;
  email!: string;
  fullName!: string;
  createdAt!: Date;
}

export function mapAdminSignupResponse(entity: UserEntity): AdminSignupResponseDto {
  return {
    id: entity.id,
    email: entity.email,
    fullName: entity.fullName,
    createdAt: entity.createdAt,
  };
}
