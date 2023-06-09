import { UserEntity } from '@app/infra/entities';

export class AdminSignupResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  createdAt!: Date;
}

export function mapAdminSignupResponse(entity: UserEntity): AdminSignupResponseDto {
  return {
    id: entity.id,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    createdAt: entity.createdAt,
  };
}
