import { UserEntity } from '../entities/user.entity';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export function mapUser(entity: UserEntity): User {
  return {
    id: entity.id,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    createdAt: entity.createdAt,
  };
}
