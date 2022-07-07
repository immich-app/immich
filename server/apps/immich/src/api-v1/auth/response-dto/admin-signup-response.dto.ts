import { UserEntity } from '@app/database/entities/user.entity';
import { ApiResponseProperty } from '@nestjs/swagger';

export class AdminSignupResponseDto {
  @ApiResponseProperty()
  id!: string;

  @ApiResponseProperty()
  email!: string;

  @ApiResponseProperty()
  firstName!: string;

  @ApiResponseProperty()
  lastName!: string;

  @ApiResponseProperty()
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
