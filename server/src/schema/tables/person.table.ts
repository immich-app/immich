import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Check,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('person')
@UpdatedAtTrigger('person_updated_at')
@Check({ name: 'CHK_b0f82b0ed662bfc24fbb58bb45', expression: `"birthDate" <= CURRENT_DATE` })
export class PersonTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

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

  @UpdateIdColumn({ indexName: 'IDX_person_update_id' })
  updateId!: Generated<string>;
}
