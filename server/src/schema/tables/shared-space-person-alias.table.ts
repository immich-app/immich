import { Column, ForeignKeyColumn, Table } from '@immich/sql-tools';
import { SharedSpacePersonTable } from 'src/schema/tables/shared-space-person.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space_person_alias')
export class SharedSpacePersonAliasTable {
  @ForeignKeyColumn(() => SharedSpacePersonTable, { onDelete: 'CASCADE', primary: true, index: false })
  personId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  userId!: string;

  @Column({ type: 'character varying' })
  alias!: string;
}
