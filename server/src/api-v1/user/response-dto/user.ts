import { UserEntity } from '../entities/user.entity';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  isAdmin: boolean;
  profileImagePath: string;
  isFirstLogin: boolean;
}

export function mapUser(entity: UserEntity): User {
  return {
    id: entity.id,
    email: entity.email,
    firstName: entity.firstName,
    lastName: entity.lastName,
    createdAt: entity.createdAt,
    isAdmin: entity.isAdmin,
    profileImagePath: entity.profileImagePath,
    isFirstLogin: entity.isFirstLoggedIn,
  };
}
