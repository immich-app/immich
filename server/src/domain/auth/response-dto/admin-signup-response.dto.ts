import { UserEntity } from '@app/infra/entities';

export class AdminSignupResponseDto {
  id!: string;
  email!: string;
  name!: string;
  createdAt!: Date;
}

export function mapAdminSignupResponse(entity: UserEntity): AdminSignupResponseDto {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.name,
    createdAt: entity.createdAt,
  };
}
