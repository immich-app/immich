import { CreateIdColumn, UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AlbumUserRole } from 'src/enum';
import { album_user_after_insert, album_users_delete_audit } from 'src/schema/functions';
import { AlbumTable } from 'src/schema/tables/album.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  AfterDeleteTrigger,
  AfterInsertTrigger,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Index,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'albums_shared_users_users', primaryConstraintName: 'PK_7df55657e0b2e8b626330a0ebc8' })
// Pre-existing indices from original album <--> user ManyToMany mapping
@Index({ name: 'IDX_427c350ad49bd3935a50baab73', columns: ['albumsId'] })
@Index({ name: 'IDX_f48513bf9bccefd6ff3ad30bd0', columns: ['usersId'] })
@UpdatedAtTrigger('album_users_updated_at')
@AfterInsertTrigger({
  name: 'album_user_after_insert',
  scope: 'statement',
  referencingNewTableAs: 'inserted_rows',
  function: album_user_after_insert,
})
@AfterDeleteTrigger({
  name: 'album_users_delete_audit',
  scope: 'statement',
  function: album_users_delete_audit,
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

  @Column({ type: 'character varying', default: AlbumUserRole.EDITOR })
  role!: AlbumUserRole;

  @CreateIdColumn({ indexName: 'IDX_album_users_create_id' })
  createId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateIdColumn({ indexName: 'IDX_album_users_update_id' })
  updateId?: string;

  @UpdateDateColumn()
  updatedAt!: Date;
}
