import { ExpressionBuilder } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { DB } from 'src/db';
import { AssetEntity } from 'src/entities/asset.entity';
import { UserStatus } from 'src/enum';
import { UserMetadataItem } from 'src/types';

export class UserEntity {
  id!: string;
  name!: string;
  isAdmin!: boolean;
  email!: string;
  storageLabel!: string | null;
  password?: string;
  oauthId!: string;
  profileImagePath!: string;
  shouldChangePassword!: boolean;
  createdAt!: Date;
  deletedAt!: Date | null;
  status!: UserStatus;
  updatedAt!: Date;
  updateId?: string;
  assets!: AssetEntity[];
  quotaSizeInBytes!: number | null;
  quotaUsageInBytes!: number;
  metadata!: UserMetadataItem[];
  profileChangedAt!: Date;
}

export const withMetadata = (eb: ExpressionBuilder<DB, 'users'>) => {
  return jsonArrayFrom(
    eb.selectFrom('user_metadata').selectAll('user_metadata').whereRef('users.id', '=', 'user_metadata.userId'),
  ).as('metadata');
};
