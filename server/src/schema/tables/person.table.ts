import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Check,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
} from 'src/sql-tools';

@Table('person')
@UpdatedAtTrigger('person_updated_at')
@Check({ name: 'CHK_b0f82b0ed662bfc24fbb58bb45', expression: `"birthDate" <= CURRENT_DATE` })
export class PersonTable {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column({ default: '' })
  name!: string;

  @Column({ default: '' })
  thumbnailPath!: string;

  @Column({ type: 'boolean', default: false })
  isHidden!: boolean;

  @Column({ type: 'date', nullable: true })
  birthDate!: Date | string | null;

  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'SET NULL', nullable: true })
  faceAssetId!: string | null;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'character varying', nullable: true, default: null })
  color?: string | null;

  @UpdateIdColumn({ indexName: 'IDX_person_update_id' })
  updateId!: string;
}
