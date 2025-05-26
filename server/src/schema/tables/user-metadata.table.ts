import { UserMetadataKey } from 'src/enum';
import { UserTable } from 'src/schema/tables/user.table';
import { Column, ForeignKeyColumn, PrimaryColumn, Table } from 'src/sql-tools';
import { UserMetadata, UserMetadataItem } from 'src/types';

@Table('user_metadata')
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
}
