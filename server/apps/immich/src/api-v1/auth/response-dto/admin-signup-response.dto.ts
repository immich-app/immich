import { UserEntity } from '@app/infra';

export class AdminSignupResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  createdAt!: string;
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
