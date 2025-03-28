import { AlbumUserRole } from 'src/enum';
import { Column, ForeignKeyColumn, Index, Table } from 'src/sql-tools';
import { AlbumTable } from 'src/tables/album.table';
import { UserTable } from 'src/tables/user.table';

@Table({ name: 'albums_shared_users_users', primaryConstraintName: 'PK_7df55657e0b2e8b626330a0ebc8' })
// Pre-existing indices from original album <--> user ManyToMany mapping
@Index({ name: 'IDX_427c350ad49bd3935a50baab73', columns: ['albumsId'] })
@Index({ name: 'IDX_f48513bf9bccefd6ff3ad30bd0', columns: ['usersId'] })
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
}
