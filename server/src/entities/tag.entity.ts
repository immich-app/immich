import { AssetEntity } from 'src/entities/asset.entity';
import { UserEntity } from 'src/entities/user.entity';

export class TagEntity {
  id!: string;
  value!: string;
  createdAt!: Date;
  updatedAt!: Date;
  updateId?: string;
  color!: string | null;
  parentId?: string;
  parent?: TagEntity;
  children?: TagEntity[];
  user?: UserEntity;
  userId!: string;
  assets?: AssetEntity[];
}
