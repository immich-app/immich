import { UserEntity } from 'src/entities/user.entity';
import { Permission } from 'src/enum';

export type AuthApiKey = {
  id: string;
  key: string;
  user: UserEntity;
  permissions: Permission[];
};
