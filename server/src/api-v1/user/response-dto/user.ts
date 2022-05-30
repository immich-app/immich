import { UserEntity } from '../entities/user.entity';

export interface User {
  id: string;
  email: string;
}

export function mapUser(entity: UserEntity): User {
  return {
    id: entity.id,
    email: entity.email,
  };
}
