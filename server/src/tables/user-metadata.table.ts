import { UserMetadata, UserMetadataItem } from 'src/entities/user-metadata.entity';
import { UserMetadataKey } from 'src/enum';
import { Column, ForeignKeyColumn, PrimaryColumn, Table } from 'src/sql-tools';
import { UserTable } from 'src/tables/user.table';

@Table('user_metadata')
export class UserMetadataTable<T extends keyof UserMetadata = UserMetadataKey> implements UserMetadataItem<T> {
  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  userId!: string;

  @PrimaryColumn({ type: 'character varying' })
  key!: T;

  @Column({ type: 'jsonb' })
  value!: UserMetadata[T];
}
