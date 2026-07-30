import {
  AfterDeleteTrigger,
  Check,
  Column,
  CreateDateColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { person_delete_audit } from 'src/schema/functions';

@Table('person')
@Index({
  name: 'idx_person_name_trigram',
  using: 'gin',
  expression: 'f_unaccent("name") gin_trgm_ops',
})
@UpdatedAtTrigger('person_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: person_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
@Check({ name: 'person_birthDate_chk', expression: `"birthDate" <= CURRENT_DATE` })
export class PersonTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ default: '' })
  name!: Generated<string>;

  @Column({ type: 'date', nullable: true })
  birthDate!: Timestamp | null;

  @Column({ type: 'character varying', nullable: true, default: null })
  color!: string | null;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  @Column({ type: 'uuid', index: true, nullable: true })
  trustedGroupId!: string;
}
