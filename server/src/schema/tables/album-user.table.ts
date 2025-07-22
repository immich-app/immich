import { CreateIdColumn, UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AlbumUserRole } from 'src/enum';
import { album_user_after_insert, album_user_delete_audit } from 'src/schema/functions';
import { AlbumTable } from 'src/schema/tables/album.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  AfterDeleteTrigger,
  AfterInsertTrigger,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'album_user' })
// Pre-existing indices from original album <--> user ManyToMany mapping
@UpdatedAtTrigger('album_user_updatedAt')
@AfterInsertTrigger({
  name: 'album_user_after_insert',
  scope: 'statement',
  referencingNewTableAs: 'inserted_rows',
  function: album_user_after_insert,
})
@AfterDeleteTrigger({
  scope: 'statement',
  function: album_user_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() <= 1',
})
export class AlbumUserTable {
  @ForeignKeyColumn(() => AlbumTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  albumsId!: string;

  @ForeignKeyColumn(() => UserTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  usersId!: string;

  @Column({ type: 'character varying', default: AlbumUserRole.Editor })
  role!: Generated<AlbumUserRole>;

  @CreateIdColumn({ index: true })
  createId!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
