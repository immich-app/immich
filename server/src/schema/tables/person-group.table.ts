import {
  AfterDeleteTrigger,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { person_group_delete_audit } from 'src/schema/functions';
import { PersonTable } from 'src/schema/tables/person.table';
import { TrustedGroupTable } from 'src/schema/tables/trusted-group.table';

@Table('person_group')
@UpdatedAtTrigger('person_group_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: person_group_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() <= 1',
})
export class PersonGroupTable {
  @ForeignKeyColumn(() => PersonTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, primary: true })
  id!: string;

  @ForeignKeyColumn(() => TrustedGroupTable)
  trustedGroupId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
