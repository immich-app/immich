import {
  Check,
  Column,
  ColumnIndex,
  CreateDateColumn,
  ForeignKeyColumn,
  PrimaryGeneratedColumn,
  Table,
  UpdateDateColumn,
  UpdateIdColumn,
} from 'src/sql-tools';
import { AssetFaceTable } from 'src/tables/asset-face.table';
import { UserTable } from 'src/tables/user.table';

@Table('person')
@Check({ name: 'CHK_b0f82b0ed662bfc24fbb58bb45', expression: `"birthDate" <= CURRENT_DATE` })
export class PersonTable {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ColumnIndex('IDX_person_update_id')
  @UpdateIdColumn()
  updateId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;

  @Column({ default: '' })
  name!: string;

  @Column({ type: 'date', nullable: true })
  birthDate!: Date | string | null;

  @Column({ default: '' })
  thumbnailPath!: string;

  @ForeignKeyColumn(() => AssetFaceTable, { onDelete: 'SET NULL', nullable: true })
  faceAssetId!: string | null;

  @Column({ type: 'boolean', default: false })
  isHidden!: boolean;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'character varying', nullable: true, default: null })
  color?: string | null;
}
