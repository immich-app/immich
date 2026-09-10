import {
  AfterDeleteTrigger,
  Check,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { person_delete_audit } from 'src/schema/functions';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { PersonGroupTable } from 'src/schema/tables/person-group.table';
import { UserTable } from 'src/schema/tables/user.table';

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
  when: 'pg_trigger_depth() <= 1',
})
@Check({ name: 'person_birthDate_chk', expression: `"birthDate" <= CURRENT_DATE` })
export class PersonTable {
  @ForeignKeyColumn(() => UserTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
    // [ownerId, personGroupId] is the PK constraint
    index: false,
  })
  ownerId!: string;

  @ForeignKeyColumn(() => PersonGroupTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  personGroupId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column({ default: '' })
  name!: Generated<string>;

  @Column({ default: '' })
  thumbnailPath!: Generated<string>;

  @Column({ type: 'boolean', default: false })
  isHidden!: Generated<boolean>;

  @Column({ type: 'date', nullable: true })
  birthDate!: Timestamp | null;

  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'SET NULL', nullable: true })
  faceAssetId!: string | null;

  @Column({ type: 'boolean', default: false })
  isFavorite!: Generated<boolean>;

  @Column({ type: 'character varying', nullable: true, default: null })
  color!: string | null;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
