import {
  AfterDeleteTrigger,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { person_user_delete_audit } from 'src/schema/functions';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { PersonTable } from 'src/schema/tables/person.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('person_user')
@UpdatedAtTrigger('person_user_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: person_user_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() <= 1',
})
export class PersonUserTable {
  @ForeignKeyColumn(() => PersonTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, primary: true })
  personId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, primary: true })
  ownerId!: string;

  @Column({ type: 'boolean', default: false })
  isHidden!: Generated<boolean>;

  @Column({ type: 'boolean', default: false })
  isFavorite!: Generated<boolean>;

  @Column({ default: '' })
  thumbnailPath!: Generated<string>;

  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'SET NULL', nullable: true })
  thumbnailFaceAssetId!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
