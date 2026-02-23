import {
  AfterDeleteTrigger,
  Column,
  ForeignKeyColumn,
  Generated,
  PrimaryColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserMetadataKey } from 'src/enum';
import { user_metadata_audit } from 'src/schema/functions';
import { UserTable } from 'src/schema/tables/user.table';
import { UserMetadata, UserMetadataItem } from 'src/types';

@UpdatedAtTrigger('user_metadata_updated_at')
@Table('user_metadata')
@AfterDeleteTrigger({
  scope: 'statement',
  function: user_metadata_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
export class UserMetadataTable<T extends keyof UserMetadata = UserMetadataKey> implements UserMetadataItem<T> {
  @ForeignKeyColumn(() => UserTable, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    primary: true,
    //  [userId, key] is the PK constraint
    index: false,
  })
  userId!: string;

  @PrimaryColumn({ type: 'character varying' })
  key!: T;

  @Column({ type: 'jsonb' })
  value!: UserMetadata[T];

  @UpdateIdColumn({ indexName: 'IDX_user_metadata_update_id' })
  updateId!: Generated<string>;

  @UpdateDateColumn({ indexName: 'IDX_user_metadata_updated_at' })
  updatedAt!: Generated<Timestamp>;
}
