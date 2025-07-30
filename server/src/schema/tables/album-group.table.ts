import { CreateIdColumn, UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AlbumUserRole } from 'src/enum';
import { album_group_delete_audit } from 'src/schema/functions';
import { AlbumTable } from 'src/schema/tables/album.table';
import { GroupTable } from 'src/schema/tables/group.table';
import {
  AfterDeleteTrigger,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table({ name: 'album_group' })
@UpdatedAtTrigger('album_group_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: album_group_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() <= 1',
})
export class AlbumGroupTable {
  @ForeignKeyColumn(() => AlbumTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  albumId!: string;

  @ForeignKeyColumn(() => GroupTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  groupId!: string;

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
