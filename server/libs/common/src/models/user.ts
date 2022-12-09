import { Tag } from './tag';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  email: string;
  password?: string;
  salt?: string;
  oauthId: string;
  profileImagePath: string;
  shouldChangePassword: boolean;
  createdAt: string;
  deletedAt?: Date;
  tags: Tag[];
}
